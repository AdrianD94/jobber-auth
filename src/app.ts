import { createConnection, winstonLogger } from "@adriand94/jobber-shared";
import 'express-async-errors';
import express from 'express';

import { Logger } from "winston";
import { databaseConnection } from "@auth/database";
import { Config } from "@auth/config";
import { checkConnection } from "@auth/elasticsearch";
import { startServer } from "@auth/server";
import { Channel } from "amqplib";
export let authChannel: Channel;


async function initialize() {
    const config: Config = new Config();
    config.cloudinaryConfig();
    const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');
    await checkConnection(log);
    await databaseConnection(log);
    authChannel = await createConnection(log, { rabbitMqUrl: config.RABBITMQ_ENDPOINT!, serviceName: 'Auth Service' }) as Channel;
    const app = express();
    startServer(app, config, log);
}

initialize();