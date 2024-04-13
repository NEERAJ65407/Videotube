import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies || req.header("Authorization")?.replace("Bearer ", ""); // getting the token from cookies or in some cases the payload is sent 
       // sent through the header in the form of Bearer <token> we extract the token
        if (!token.accessToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token.accessToken, process.env.ACCESS_TOKEN_SECRET); // decoding the jwt token to get the payload using the secret

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user; // adding user object to req so that we can access the user details in the next middleware or any other function in the particular route
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

