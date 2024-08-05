import express, { Router } from "express";
import { create } from "@auth/controllers/seeds";


const router = express.Router();

export function seedRoutes(): Router {
    router.put('/seed/:count', create)

    return router
}