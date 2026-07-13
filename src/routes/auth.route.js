import { Router } from "express";
import { registerUser, login, logout } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator, loginValidator } from "../validators/auth.validator.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router= Router()

router.route("/register").post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post(loginValidator(), validate , login);
router.route("/logout").post(verifyJwt, logout);
router.route("/")

export default router;