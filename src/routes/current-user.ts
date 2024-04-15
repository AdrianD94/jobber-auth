import express, { Router } from "express";
import { read, resendEmail } from "@auth/controllers/current-user";
import { token } from "@auth/controllers/refresh-token";

const router = express.Router();

export function currentUserRoutes(): Router {
    router.get('/current-user', read)
    router.post('/resend-email', resendEmail)
    router.get('/refresh-token/:username', token)

    return router
}