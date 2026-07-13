import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationEmailGenContent, sendEmail } from "../utils/mail.js";

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
})

export { registerUser, login, logout, getCurrentUser}