
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, uploads, lowerCase } from '@adriand94/jobber-shared';
import { signupSchema } from '@auth/schemes/signup';
import { createUser, getUserByUsernameOrEmail, signToken } from '@auth/services/service.auth';
import { Request, Response } from 'express';
import { v4 } from 'uuid';
import { UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';
import { Config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/app';
import { StatusCodes } from 'http-status-codes';

const config = new Config();

export async function create(req: Request, res: Response): Promise<any> {
    const { error } = await signupSchema.validateAsync(req.body);
    if (error?.details) {
        // return res.status(StatusCodes.BAD_REQUEST).json({ error: error.details[0].message });
        throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
    }
    const { username, email, password, country, profilePicture } = req.body;
    const userExists: IAuthDocument = await getUserByUsernameOrEmail(username, email) as IAuthDocument;
    if (userExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid credentials' });
    }
    const profilePublicId = v4();
    const uploadResult: UploadApiResponse = await uploads(profilePicture, `${profilePublicId}`, true, true) as UploadApiResponse;
    if (!uploadResult.public_id) {
        throw new BadRequestError('File upload error', 'SignUp create() method error');
    }
    const randomBytes: Buffer = crypto.randomBytes(20);
    const randomChars = randomBytes.toString('hex');
    const authData: IAuthDocument = {
        username: firstLetterUppercase(username),
        email: lowerCase(email),
        profilePublicId,
        country,
        password,
        profilePicture: uploadResult?.secure_url,
        emailVerificationToken: randomChars
    } as IAuthDocument;

    const result: IAuthDocument = await createUser(authData);
    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
    const messageDetail: IEmailMessageDetails = {
        receiverEmail: result.email,
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
    const userJwt = signToken(result.id!, result.email!, result.username!);
    res.status(StatusCodes.CREATED).json({ message: 'User created succesfully', user: result, token: userJwt })
}