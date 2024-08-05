import { Application } from "express";
import { authRoutes } from "./routes/auth";
import { currentUserRoutes } from "./routes/current-user";
import { verifyGatewayRequest } from "@adriand94/jobber-shared";
import { healthRoute } from "./routes/health";
import { searchRoutes } from "./routes/search";
import { seedRoutes } from "./routes/seed";

const BASE_PATH = '/api/v1/auth';
export function appRoutes(app: Application): void {
    app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, currentUserRoutes());
    app.use(BASE_PATH, searchRoutes());
    app.use(BASE_PATH, seedRoutes());
    app.use('', healthRoute());
}