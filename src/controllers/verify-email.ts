import { BadRequestError, IAuthDocument } from "@adriand94/jobber-shared";
import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from "@auth/services/service.auth";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function update(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const userExist: IAuthDocument | undefined = await getAuthUserByVerificationToken(token);
    if (!userExist) {
        throw new BadRequestError('Verification token is either invalid or is already used', 'VerifyEmailUpdate() error');
    }
    await updateVerifyEmailField(userExist.id!, 1, '');
    const updatedUser = await getAuthUserById(userExist.id!);
    res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: updatedUser });
}
