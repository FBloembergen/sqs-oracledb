#!/usr/bin/env node
import { SQS } from 'aws-sdk';
import OracleDB from 'oracledb';
import { readpoolConfigFromEnv, sendToOracleDB } from './oracle';
import { getEnv } from './util';

const sqsClient = new SQS({ region: 'eu-west-1' });
const sqsUrl = getEnv('SQSURL');
const removeFromQueue = async (messageReceiptHandle: string | undefined) => {
    messageReceiptHandle && await sqsClient.deleteMessage({ QueueUrl: sqsUrl, ReceiptHandle: messageReceiptHandle }).promise();
};

const main = async () => {
    const pool = await OracleDB.createPool(readpoolConfigFromEnv());
    while (true) {
        console.log(`${new Date().toISOString()} INFO: Polling for sqs messages...`);
        const sqsData = await sqsClient.receiveMessage({
            QueueUrl: sqsUrl,
            WaitTimeSeconds: 20
        }).promise();
        if (sqsData.Messages) {
            await Promise.all(sqsData.Messages.map(async message => {
                console.log(`${new Date().toISOString()} INFO: Got a message! ${message.Body}`);
                try {
                    const start = new Date();
                    // Process message towards oracleDB, in this example only the body
                    await sendToOracleDB(pool, message.Body);
                    // Delete message from SQS, succesfully processed
                    console.log(`${new Date().toISOString()} INFO: Succesfully processed ${message.MessageId}, deleting from queue...`);
                    await removeFromQueue(message.ReceiptHandle);
                    const end = new Date();
                    console.log(`${new Date().toISOString()} INFO: All done, took ${(end.valueOf() - start.valueOf()) / 1000} sec.)`);
                } catch (e) {
                    console.log(`${new Date().toISOString()} ERROR: ${e.stack || e}`);
                    return;
                }
            }));
        }
    }
};

main().catch(e => console.error(e));
