import cors from "cors";
import { Application, Request, Response, NextFunction, json, urlencoded } from "express";
import helmet from "helmet";
import hpp from "hpp";
import { Config } from "@auth/config";
import { verify } from "jsonwebtoken";
import { CustomError, IAuthPayload, IErrorResponse } from "@adriand94/jobber-shared";
import compression from "compression";
import { Logger } from "winston";
import http from 'http';
import { appRoutes } from "@auth/routes";

const SERVER_PORT = 4002;

export function startServer(app: Application, config: Config, logger: Logger): void {
    securityMiddleware(app, config);
    standarMiddleware(app);
    routesMiddleware(app);
    autoErrorHandler(app, logger);
    startHttpServer(app,logger);
}

function securityMiddleware(app: Application, config: Config): void {
    app.set('trust proxy', 1);
    app.use(hpp());
    app.use(helmet());
    app.use(cors({
        origin: config.API_GATEWAY_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            const payload = verify(token, config.JWT_TOKEN!) as IAuthPayload;
            req.currentUser = payload;
        }
        next()
    })
}

function routesMiddleware(app: Application): void {
    appRoutes(app);
}

function standarMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '200mb' }));
    app.use(urlencoded({ extended: true, limit: '200mb' }));
}

function autoErrorHandler(app: Application, logger: Logger): void {
    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
 
        logger.log('error', `AuthService ${error.comingFrom}:`, error);
        if (error instanceof CustomError) {
            res.status(error.statusCode).json(error.serializeError());
        }
        next();
    });
}

function startHttpServer(app: Application, logger: Logger): void {
    try {
        logger.info(`Worker with process id of ${process.pid} on auth server has started`);
        const httpServer = http.createServer(app);
        httpServer.listen(SERVER_PORT, () => {
            logger.info(`Auth server running on port ${SERVER_PORT}`);
        });
    } catch (error) {
        logger.log('error', `AuthService startServer() error method:`, error);
    }
}