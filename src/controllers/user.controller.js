import {asyncHandler} from '../utils/asyncHandler.js';

const registerUser = asyncHandler( (req,res) => {
    res.status(200).json({
        message : "User Registered Successfully"
    })
} )

const loginUser = asyncHandler( (req,res) => {
    res.status(200).json({
        message : "User Logged in Successfully"
    })
} )

export {
    registerUser,
    loginUser
} ;