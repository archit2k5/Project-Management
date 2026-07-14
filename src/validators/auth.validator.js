import { body } from "express-validator"
import { validate } from "../middlewares/validator.middleware.js";

const userRegistrationValidator=()=>{

    return [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Must be a valid email address'),
        body('password')
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('username')
            .notEmpty()
            .withMessage('Username is required')
            .isAlphanumeric()
            .withMessage('Username can only contain letters and numbers')
    ]

}

const loginValidator= ()=>{
    return [
        body("email")
            .isEmail()
            .withMessage("Enter a valid email")
            .notEmpty()
            .withMessage("Email is required"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const userChangeCurrentPasswordValidator= ()=>{
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New password is required")
    ];
}

const userForgotPasswordValidator = ()=>{
    return [
        body("email")
            .isEmail()
            .withMessage("Enter a valid email")
            .notEmpty()
            .withMessage("Email is required")
    ];
}

const userResetPasswordValidator = ()=>{
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("New password cannot be empty")
    ];
}

export { userRegistrationValidator, loginValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, userResetPasswordValidator };