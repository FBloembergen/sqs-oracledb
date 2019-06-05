import OracleDB from 'oracledb';
import { getEnv, parseEnvVar } from './util';

export async function sendToOracleDB(readyConnectionPool: OracleDB.Pool, message: any) {
    const readyConnection = await (readyConnectionPool.getConnection() as Promise<OracleDB.Connection>);
    try {
        await (readyConnection.execute(
            `begin
                :event := OFBL.processSQSMessage(:message);
            end;`,
            {
                message: { dir: OracleDB.BIND_IN, type: OracleDB.STRING, val: JSON.stringify(message) },
                processdata: { dir: OracleDB.BIND_OUT, type: OracleDB.STRING, maxSize: 32767 }
            }
        ));
        await (readyConnection.commit() as Promise<void>);
    } finally {
        await (readyConnection.close() as Promise<void>);
    }
}

export function readpoolConfigFromEnv(): OracleDB.PoolAttributes {
    const poolConfig: OracleDB.PoolAttributes = { connectString: getEnv('ORACLEDB_connectString') };
    Object.keys(process.env)
        .filter(key => key.startsWith('ORACLEDB_'))
        .forEach(key => poolConfig[key.substring('ORACLEDB_'.length)] = parseEnvVar(key));
    return poolConfig;
}
