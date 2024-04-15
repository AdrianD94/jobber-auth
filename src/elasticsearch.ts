import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';
import { Config } from '@auth/config';

const config = new Config();
export const elasticSearchClient = new Client({
    node: `${config.ELASTIC_SEARCH_URL}`
});
export async function checkConnection(log: Logger): Promise<void> {
    let isConnected: boolean = false;
    let attemptNr: number = 0;

    while (!isConnected && attemptNr < 3) {
        try {
            const health: ClusterHealthHealthResponseBody = await elasticSearchClient.cluster.health({});
            log.info(`AuthService ElasticSearch health status - ${health.status}`);
            isConnected = true;
        } catch (error) {
            log.error('Connection to ElasticSearch failed. Retrying....');
            log.log('error', 'AuthService checkConenction() method:', error);
            isConnected = false;
            attemptNr++;
        }
    }
}
