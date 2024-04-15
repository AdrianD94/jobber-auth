import { winstonLogger } from "@adriand94/jobber-shared";
import { Config } from "@auth/config";
import { Channel } from "amqplib";
import { Logger } from "winston";

const config = new Config();
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

export async function publishDirectMessage(channel: Channel, exchangeName: string, routingKey: string, message: string, logMessage: string): Promise<void> {
    try {
        if (!channel) {
            log.log('error', 'AuthService RabbitMq channel not created!');
            return;
        }
        await channel.assertExchange(exchangeName, 'direct');
        channel.publish(exchangeName, routingKey, Buffer.from(message));
        log.info(logMessage);
    } catch (error) {
        log.log('error', 'AuthService Provider publishDirectMessage() method error', error);
    }
}