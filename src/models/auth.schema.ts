import { IAuthDocument } from '@adriand94/jobber-shared';
import { sequelize } from '@auth/database';
import { compare, genSalt, hash } from 'bcryptjs';
import { DataTypes, Model, ModelDefined, Optional } from 'sequelize';

const SALT_ROUND = 10;

type AuthUserCreationAttributes = Optional<IAuthDocument, 'id' | 'createdAt' | 'passwordResetToken' | 'passwordResetExpires'>;

export const AuthModel: ModelDefined<IAuthDocument, AuthUserCreationAttributes> = sequelize.define('auth', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profilePublicId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Date.now
    },
    passwordResetToken: { type: DataTypes.STRING, allowNull: true },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    }
},
    {
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                unique: true,
                fields: ['username']
            }
        ]

    }
);

AuthModel.addHook('beforeCreate', async (auth: Model) => {
    const salt = await genSalt(SALT_ROUND);
    const hashedPassword = await hash(auth.dataValues.password as string, salt);
    auth.dataValues.password = hashedPassword
});

AuthModel.prototype.comparePassword = async function (password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
}
AuthModel.prototype.hashPassword = async function (password: string): Promise<string> {
    return hash(password, SALT_ROUND);
}
if(process.env.NODE_ENV !=='test'){
    AuthModel.sync({});
}