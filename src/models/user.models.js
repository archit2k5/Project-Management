import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
    {
        avatar:{
            type:{
                url: String,
                localPath: String,
            },
            default:{
                url: `https://placehold.net/avatar.png`,
                localPath: "",
            }
        },
        username:{
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        email:{
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        fullName:{
            type: String,
            trim: true,
        },
        password:{
            type: String,
            required: [true, "Password is required"],
        },
        isEmailVerified:{
            type: Boolean,
            default: false,
        },
        refreshToken:{
            type: String,
        },
        forgotPasswordToken:{
            type: String,
        },
        forgotPasswordExpiry:{
            type: Date,
        },
        emailVerificationToken:{
            type: String,
        },
        emailVerificationExpiry:{
            type: Date,
        },
    }, 
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.createAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}

    )
}

userSchema.methods.createRefreshToken= function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.REFRESH_TOKEN_SECREY,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

//only to be used when resetting password or verifying email
userSchema.methods.createTemporaryToken= function(){
    const unhasedToken= crypto.randomBytes(20).toString("hex");

    const hashedToken= crypto
        .createHash("sha256")
        .update(unhasedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (20*60*1000) //20 mins
    return {unhasedToken, hashedToken, tokenExpiry};

}

userSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password, this.password);
}

export const User= mongoose.model("User", userSchema);