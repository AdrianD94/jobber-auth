import { IAuthDocument } from "@adriand94/jobber-shared";
import { getUserByUsername, signToken } from "@auth/services/service.auth";
import { Request, Response } from 'express';
import { StatusCodes } from "http-status-codes";

export async function token(req: Request, res: Response): Promise<any> {
    const existingUser: IAuthDocument = await getUserByUsername(req.params.username) as IAuthDocument;
    const userJWT = signToken(existingUser.id!, existingUser.email!, existingUser.username!);
    res.status(StatusCodes.OK).json({ message: 'Refresh token', user: existingUser, token: userJWT });
}