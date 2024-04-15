import { IAuthBuyerMessageDetails, IAuthDocument, firstLetterUppercase, lowerCase, winstonLogger } from "@adriand94/jobber-shared";
import { authChannel } from "@auth/app";
import { Config } from "@auth/config";
import { AuthModel } from "@auth/models/auth.schema";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { sign } from "jsonwebtoken";
import { omit } from "lodash";
import { Model, Op } from "sequelize";
import { Logger } from "winston";

const config = new Config();
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

export async function createUser(data: IAuthDocument): Promise<IAuthDocument> {
    const result: Model = await AuthModel.create(data);
    const messageDetails: IAuthBuyerMessageDetails = {
        username: result.dataValues.username,
        email: result.dataValues.email,
        profilePicture: result.dataValues.profilePicture,
        country: result.dataValues.country,
        createdAt: result.dataValues.createdAt,
        type: 'auth'
    };

    await publishDirectMessage(authChannel, 'jobber-buyer-update', 'user-buyer', JSON.stringify(messageDetails), 'buyer details sent to buyer service');
    const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
    return userData
}

export async function getAuthUserById(authId: number): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: { id: authId },
            attributes: {
                exclude: ['password']
            }
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: {
                [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
            },
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function getUserByUsername(username: string): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: { username: firstLetterUppercase(username) },
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function getUserByEmail(email: string): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: { email: lowerCase(email) },
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: { emailVerificationToken: token },
            attributes: {
                exclude: ['password']
            }
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | undefined> {
    try {
        const user: Model = await AuthModel.findOne({
            where: {
                [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
            },
        }) as Model;
        return user?.dataValues;
    } catch (error) {
        log.error(error);
    }
}

export async function updateVerifyEmailField(authId: number, emailVerified: number, emailVerificationToken?: string): Promise<void> {
    try {
        await AuthModel.update(
             {
                emailVerified,
                emailVerificationToken
            },
            { where: { id: authId } },
        );
    } catch (error) {
        log.error(error);
    }
}

export async function updatePasswordToken(authId: number, token: string, tokenExpiration: Date): Promise<void> {
    try {
        await AuthModel.update(
            {
                passwordResetToken: token,
                passwordResetExpires: tokenExpiration
            },
            { where: { id: authId } },
        );
    } catch (error) {
        log.error(error);
    }
}

export async function updatePassword(authId: number, password: string): Promise<void> {
    try {
        await AuthModel.update(
            {
                password,
                passwordResetToken: '',
                passwordResetExpires: new Date()
            },
            { where: { id: authId } },
        );
    } catch (error) {
        log.error(error);
    }
}

export function signToken(id: number, email: string, username: string): string {
    return sign(
        {
            id,
            email,
            username
        },
        config.JWT_TOKEN!
    );
}