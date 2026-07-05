import mongoose, { Schema } from "mongoose";
import { isValidElement } from "react";

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

export const User= mongoose.model("User", userSchema);