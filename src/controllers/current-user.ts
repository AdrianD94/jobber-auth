import { BadRequestError, IAuthDocument, IEmailMessageDetails, lowerCase } from "@adriand94/jobber-shared";
import { getAuthUserById, getUserByEmail, updateVerifyEmailField } from "@auth/services/service.auth";
import { Request, Response } from 'express';
import { StatusCodes } from "http-status-codes";
import crypto from 'crypto';
import { Config } from "@auth/config";
import { authChannel } from "@auth/app";
import { publishDirectMessage } from "@auth/queues/auth.producer";

const config = new Config();

export async function read(req: Request, res: Response): Promise<any> {
    let user = null;
    const existingUser: IAuthDocument = await getAuthUserById(req.currentUser!.id) as IAuthDocument;
    if (Object.keys(existingUser).length) {
        user = existingUser
    }
    res.status(StatusCodes.OK).json({ message: 'Authenticated user', user });
}


export async function resendEmail(req: Request, res: Response): Promise<any> {
    const { email, userId } = req.body;
    const checkIfUserExist: IAuthDocument = await getUserByEmail(lowerCase(email)) as IAuthDocument;
    if (!checkIfUserExist) {
        throw new BadRequestError('Email is invalid', 'CurrentUser resentEmail() method error');
    }
    const randomBytes: Buffer = crypto.randomBytes(20);
    const randomChars = randomBytes.toString('hex');

    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomChars}`;
    await updateVerifyEmailField(parseInt(userId), 0, randomChars);

    const messageDetail: IEmailMessageDetails = {
        receiverEmail: lowerCase(email),
        verifyLink: verificationLink,
        template: 'verifyEmail'
    }

    await publishDirectMessage(
        authChannel,
        'jobber-email-notification',
        'auth-email',
        JSON.stringify(messageDetail),
        'Verify email message has been sent to notification service',
    );
    const updatedUser = await getAuthUserById(parseInt(userId));
    res.status(StatusCodes.CREATED).json({ message: 'Email verification sent', user: updatedUser })
}

