const neo4j = require('neo4j-driver');

let driver = null;

const initDriver = () => {
    if (driver) return driver;

    if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
        console.warn('⚠️ Neo4j credentials missing - running without graph memory');
        return null;
    }

    driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
        {
            maxConnectionLifetime: 3 * 60 * 60 * 1000,
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 10000
        }
    );

    console.log('✅ Neo4j driver initialized');
    return driver;
};

const testConnection = async () => {
    const d = initDriver();
    if (!d) return false;
    const session = d.session();
    try {
        await session.run('RETURN 1');
        console.log('✅ Neo4j AuraDB connected');
        return true;
    } catch (err) {
        console.error('❌ Neo4j connection failed:', err.message);
        return false;
    } finally {
        await session.close();
    }
};

const saveUserSession = async (userId, sessionData) => {
    const d = initDriver();
    if (!d) return false;
    const session = d.session();
    try {
        const { task, language, response, agentType, timestamp } = sessionData;
        await session.run(
            `MERGE (u:User {id: $userId})
       CREATE (s:Session {
         id: $sessionId,
         task: $task,
         language: $language,
         response: $response,
         agentType: $agentType,
         timestamp: $timestamp
       })
       MERGE (u)-[:HAD_SESSION]->(s)
       MERGE (l:Language {code: $language})
       MERGE (s)-[:IN_LANGUAGE]->(l)
       MERGE (a:AgentType {name: $agentType})
       MERGE (s)-[:USED_AGENT]->(a)`,
            {
                userId,
                sessionId: `session_${Date.now()}`,
                task,
                language,
                response,
                agentType,
                timestamp
            }
        );
        return true;
    } catch (err) {
        console.error('Neo4j saveUserSession error:', err.message);
        return false;
    } finally {
        await session.close();
    }
};

const getUserHistory = async (userId, limit = 20) => {
    const d = initDriver();
    if (!d) return [];
    const session = d.session();
    try {
        const result = await session.run(
            `MATCH (u:User {id: $userId})-[:HAD_SESSION]->(s:Session)
       OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(l:Language)
       OPTIONAL MATCH (s)-[:USED_AGENT]->(a:AgentType)
       RETURN s.id as id, s.task as task, s.response as response,
              s.timestamp as timestamp, l.code as language, a.name as agentType
       ORDER BY s.timestamp DESC
       LIMIT $limit`,
            { userId, limit: neo4j.int(limit) }
        );
        return result.records.map(record => ({
            id: record.get('id'),
            task: record.get('task'),
            response: record.get('response'),
            timestamp: record.get('timestamp'),
            language: record.get('language'),
            agentType: record.get('agentType')
        }));
    } catch (err) {
        console.error('Neo4j getUserHistory error:', err.message);
        return [];
    } finally {
        await session.close();
    }
};

const getRelatedTasks = async (agentType, language) => {
    const d = initDriver();
    if (!d) return [];
    const session = d.session();
    try {
        const result = await session.run(
            `MATCH (s:Session)-[:USED_AGENT]->(a:AgentType {name: $agentType})
       MATCH (s)-[:IN_LANGUAGE]->(l:Language {code: $language})
       RETURN s.task as task, count(*) as frequency
       ORDER BY frequency DESC
       LIMIT 5`,
            { agentType, language }
        );
        return result.records.map(record => ({
            task: record.get('task'),
            frequency: record.get('frequency').toNumber()
        }));
    } catch (err) {
        console.error('Neo4j getRelatedTasks error:', err.message);
        return [];
    } finally {
        await session.close();
    }
};

const closeDriver = async () => {
    if (driver) {
        await driver.close();
        driver = null;
        console.log('Neo4j driver closed');
    }
};

process.on('SIGINT', closeDriver);
process.on('SIGTERM', closeDriver);

module.exports = {
    testConnection,
    saveUserSession,
    getUserHistory,
    getRelatedTasks
};