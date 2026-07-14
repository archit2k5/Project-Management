import { validate } from "../middlewares/validator.middleware.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationEmailGenContent, forgotPasswordEmailGenContent, sendEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken"

const generateAccessAndAccessToken = async function(userId){

    try{
        const user= await User.findById(userId);

        const refreshToken= user.createRefreshToken();
        const accessToken= user.createAccessToken();
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken }
    } catch(err){
        throw new ApiError(
            500,
            "Something went wrong while generating tokens",
            [err]
        )
    }
}

const registerUser = asyncHandler(async (req, res, next)=>{
    const { username, email, password, role } = req.body;

    const ExistingUser=await User.findOne({
        $or: [{username}, {email}]
    });

    if(ExistingUser){
        throw new ApiError(409, "User with email or username already exist.", []);
    }

    const user= await User.create({
        email,
        password,
        username, 
        isEmailVerified:false
    });

    const { unhasedToken, hashedToken, tokenExpiry } = user.createTemporaryToken();

    user.emailVerificationToken=hashedToken;
    user.emailVerificationExpiry=tokenExpiry;

    await user.save({validateBeforeSave: false});

    sendEmail({
        email: user.email,
        subject: "Email verification",
        mailGenContent: emailVerificationEmailGenContent(
            user?.username,
            `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${unhasedToken}`
        )
    })
    
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken -emailVerificaionToken -emailVerificationExpiry"
    );

    if(!createdUser){
        throw new ApiError(
            500,
            "Something went wrong registering the user"
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {user:createdUser}, "User registered successfully and verification email has been sent on email")
    )

});

const login = asyncHandler(async (req, res)=>{
    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "Email is requird");
    }

    const user= await User.findOne({email});

    if(!user){
        throw new ApiError(404, "User doesn't exist")
    }

    const test=user.isPasswordCorrect(password);

    if(!test){
        throw new ApiError(400, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndAccessToken(user._id);
    const loggedInUser= await User.findById(user._id).select(
        "-password -refreshToken -emailVerificaionToken -emailVerificationExpiry"
    );

    const options={
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: "Logged in User",
                accessToken, 
                refreshToken
            },
            "User logged in"
        ));
});

const logout = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {
            now: true
        }
    );
    const options={
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));

});

const getCurrentUser= asyncHandler(async(req, res)=>{
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
});

const verifyEmail= asyncHandler(async(req, res)=>{
    const { verificationToken }= req.params;
    if(!verificationToken){
        throw new ApiError(400, "Email verification token is missing");
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")
    
    let user= await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: {$gt: Date.now()}
    });
     
    if(!user){
        throw new ApiError(400, "Token is missing or invalid")
    }

    user.verificationToken=undefined;
    user.emailVerificationExpiry=undefined;
    user.isEmailVerified= true;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                isEmailVerified: true
            },
            "Email is verified"
        ));
});

const resendEmailVerification= asyncHandler(async (req, res)=>{

    const { username, email }= req.body;
    const user= await User.findOne({
        username
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }

    if(user.isEmailVerified){
        throw new ApiError(400, "Email is already verified");
    }

    const { unhasedToken, hashedToken, tokenExpiry } = user.createTemporaryToken();
    user.emailVerificationToken= hashedToken;
    user.emailVerificationExpiry= tokenExpiry;
    await user.save({validateBeforeSave: false});

    sendEmail({
        email: user.email,
        subject: "Email verification",
        mailGenContent: emailVerificationEmailGenContent(
            user?.username,
            `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${unhasedToken}`
        )
    });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Mail has been sent to your email"
        ));

});

const refreshAccessToken = asyncHandler(async (req, res)=>{

    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access");
    }

    const decodedRefreshToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user= await User.findById(decodedRefreshToken._id);

    if(!user){
        throw new ApiError(401, "Invalid refresh token");
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired");
    }

    const options ={
        httpOnly: true,
        secure: true
    }

    const { accessToken, refreshToken : newRefreshToken } = await generateAccessAndAccessToken(user._id);

    user.refreshToken=incomingRefreshToken;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json( new ApiResponse(
            200,
            { accessToken, incomingRefreshToken},
            "New Refresh Token generated"
        ))
});

const forgotPassword = asyncHandler(async (req, res)=>{

    const { email } = req.body;

    const user= await User.findOne({email});

    if(!user){
        throw new ApiError(404, "User doesn't exist");
    }

    const { unhasedToken, hashedToken, tokenExpiry }= user.createTemporaryToken();
    
    user.forgotPasswordToken=hashedToken;
    user.forgotPasswordExpiry=tokenExpiry;
    user.save({validateBeforeSave: false});

    sendEmail({
        email: user.email,
        subject: "Reset password",
        mailGenContent: forgotPasswordEmailGenContent(
            user?.username,
            `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${unhasedToken}`
        )
    });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Reset password mail has been sent to your email"
        ));
});

const resetPassword = asyncHandler(async (req, res)=>{
    const { resetToken } = req.params; // route /:resetToken
    const { newPassword } = req.body;

    if(!resetToken){
        throw new ApiError(400, "Reset password token is missing");
    }

    const hashedToken= crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if(!user){
        throw new ApiError(489, "Missing or Invalid Token");
    }


    user.forgotPasswordToken=undefined;
    user.forgotPasswordExpiry=undefined;
    user.password=newPassword;

    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password reset successful"
        ))
});

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;

    const user= await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        return new ApiError(400, "Invalid old Password");
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password changed successfully"
        ))
})

export { registerUser, login, logout, getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotPassword, resetPassword, changeCurrentPassword }