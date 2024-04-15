import { Sequelize } from "sequelize";
import { Logger } from "winston";
import { Config } from "./config";

const config: Config = new Config();
export const sequelize = new Sequelize(config.MYSQL_DB!, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        multipleStatements: true
    },
})

export async function databaseConnection(log: Logger): Promise<void> {
    try {
        await sequelize.authenticate();
        log.info('AuthService Mysql database connection has been established successfully.');
    } catch (error) {
        log.error('Auth Service - Unable to connect to database.');
        log.log('error', 'AuthService databaseConnection() method error:', error);
    }
}