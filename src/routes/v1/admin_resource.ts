import express, { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
import { NationalIDRegex, passwordRegex, phoneNumberRegex } from '../../utils/globalValidations';
import { validate } from '../../middleware/middleware';
import { gender } from '../../interfaces/userInterface';
import { AdminUser, User } from '../../db/models';
import { asyncMiddleware } from '../../middleware/error_middleware';
import output from '../../utils/response';
import { db } from '../../db';
import { generate } from '../../utils/bcrypt';
import { sign } from '../../utils/jwt';

const router = express.Router();

// Admin registration validations
const adminSignupValidations = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    NID: Joi.string().regex(NationalIDRegex).required().messages({
        'string.base': 'Please provide a valid National ID',
        'string.pattern.base': 'Please provide a valid National ID',
        'string.empty': 'National ID is required',
    }),
    gender: Joi.string().valid(...gender).required(),
    phoneNumber: Joi.string().regex(phoneNumberRegex).required().messages({
        'string.base': 'Please provide phone number, starting with country code.',
        'string.pattern.base': 'Please provide phone number, starting with country code.',
        'string.empty': 'Phone number is required',
    }),
    password: Joi.string().regex(passwordRegex).required().messages({
        'string.base': 'Please provide a valid password',
        'string.pattern.base': 'Password must have at least 8 characters, including uppercase, lowercase, and a digit',
        'string.empty': 'Password is required',
    }),
    position: Joi.string().required(),
});

// Admin signup
router.post('/signup', validate(adminSignupValidations), asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    const { email, phoneNumber, password, position, NID } = req.body;
    const userExists = await User.findOne({ where: { [Op.or]: [{ email }, { phoneNumber }, { NID }] } });
    if (userExists) {
        return output(res, 409, 'User already exixts', null, 'CONFLICT_ERROR');
    }
    const hashedPassword = await generate(password);
    const adminUser = await db.transaction(async (t) => {
        const user = await User.create({ ...req.body, password: hashedPassword, role: 'admin' }, { transaction: t });
        const newAdmin = await AdminUser.create({ userId: user.id, position }, { transaction: t });
        user.password = undefined;
        return {
            ...user.dataValues,
            position: newAdmin.position,
        };
    });

    const token = sign({ adminUserId: adminUser.id, role: adminUser.role });
    return output(res, 201, 'Signup successfully', { adminUser, token }, null);
})
);

export default router;
