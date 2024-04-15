import { BadRequestError, IEmailMessageDetails } from "@adriand94/jobber-shared";
import { changePasswordSchema, emailSchema, passwordSchema } from "@auth/schemes/password";
import { getAuthUserByPasswordToken, getUserByEmail, getUserByUsername, updatePassword, updatePasswordToken } from "@auth/services/service.auth";
import { Request, Response } from "express";
import crypto from 'crypto';
import { authChannel } from "@auth/app";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { Config } from "@auth/config";
import { StatusCodes } from "http-status-codes";
import { AuthModel } from "@auth/models/auth.schema";

const config = new Config();
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(emailSchema.validate(req.body));
    if (error?.details) {
        throw new BadRequestError(error.details[0].message, 'Password create() method error');
    }
    const { email } = req.body;
    const existingUser = await getUserByEmail(email);
   
    if (!existingUser) {
        throw new BadRequestError('Invalid credentails', 'Password create() method error');
    };

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomChars: string = randomBytes.toString('hex');
    const date = new Date();
    date.setHours(date.getHours() + 1);
    await updatePasswordToken(existingUser.id!, randomChars, date);
    const resetLink = `${config.CLIENT_URL}/reset_password?token=${randomChars}`;
    const messageDetails: IEmailMessageDetails = {
        receiverEmail: existingUser.email,
        resetLink,
        username: existingUser.username,
        template: 'forgotPassword'
    }
    await publishDirectMessage(
        authChannel,
        'jobber-email-notification',
        'auth-email',
        JSON.stringify(messageDetails),
        'Forgot password message sent to notification service.'
    )
    res.status(StatusCodes.OK).json({ message: 'Password reset email sent.' });
}
export async function resetPassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(passwordSchema.validate(req.body));
    if (error?.details) {
        throw new BadRequestError(error.details[0].message, 'Password resetPassword() method error');
    }
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
        throw new BadRequestError('Password do not match', 'Password resetPassword() method error');
    }

    const existingUser = await getAuthUserByPasswordToken(token);

    if (!existingUser) {
        throw new BadRequestError('Reset token expired', 'Password create() method error');
    };

    const hashedPassword = await AuthModel.prototype.hashPassword(password);
    await updatePassword(existingUser.id!, hashedPassword);

    const messageDetails: IEmailMessageDetails = {
        username: existingUser.username,
        template: 'resetPasswordSuccess'
    }
    await publishDirectMessage(
        authChannel,
        'jobber-email-notification',
        'auth-email',
        JSON.stringify(messageDetails),
        'Reset password success message sent to notification service.'
    )
    res.status(StatusCodes.OK).json({ message: 'Password successfully updated' });
}
export async function changePassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(changePasswordSchema.validate(req.body));
    console.log(error?.details);
    if (error?.details) {
        throw new BadRequestError(error.details[0].message, 'Password changePassword() method error');
    }
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
        throw new BadRequestError('Invalid password', 'Password changePassword() method error');
    }

    const existingUser = await getUserByUsername(req.currentUser?.username as string);

    if (!existingUser) {
        throw new BadRequestError('Invalid password', 'Password changePassword() method error');
    };

    const hashedPassword = await AuthModel.prototype.hashPassword(newPassword);
    await updatePassword(existingUser.id!, hashedPassword);

    const messageDetails: IEmailMessageDetails = {
        username: existingUser.username,
        template: 'resetPasswordSuccess'
    }
    await publishDirectMessage(
        authChannel,
        'jobber-email-notification',
        'auth-email',
        JSON.stringify(messageDetails),
        'Password change success message sent to notification service.'
    )
    res.status(StatusCodes.OK).json({ message: 'Password successfully updated' });
}