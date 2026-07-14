import { Router } from "express";
import { registerUser, login, logout, getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotPassword, resetPassword, changeCurrentPassword } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator, loginValidator, userChangeCurrentPasswordValidator, userForgotPasswordValidator, userResetPasswordValidator } from "../validators/auth.validator.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router= Router()

//unsecure routes
router.route("/register").post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post(loginValidator(), validate , login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPassword);
router.route("/reset-password/:resetToken").post(userResetPasswordValidator(), validate, resetPassword);

//secure routes
router.route("/logout").post(verifyJwt, logout);
router.route("/current-user").get(verifyJwt ,getCurrentUser);
router.route("/change-password").post(verifyJwt, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJwt, resendEmailVerification)


export default router;