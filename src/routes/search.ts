import express, { Router } from "express";
import { gigs, singleGigById } from "@auth/controllers/search";


const router = express.Router();

export function searchRoutes(): Router {
    router.get('/search/gig/:from/:size/:type', gigs)
    router.get('/search/gig/:gigId', singleGigById)

    return router
}