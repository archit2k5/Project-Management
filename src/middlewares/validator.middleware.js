import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next)=>{
    const errors=  validationResult(req);

    if(errors.isEmpty()){
        return next();
    }

    const extractedErrors= []
    errors.array().forEach((elem) =>{
        extractedErrors.push({
            [elem.path]:elem.msg
        });
    });

    throw new ApiError(422, "Received data is not valid", extractedErrors);
}