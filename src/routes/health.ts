import { health } from "@auth/controllers/health";
import express, { Router } from "express";

const router = express.Router();

export function healthRoute(): Router {
    router.get('/auth-health', health);

    return router
}