import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'; // the user was created in the user model and can directly connect with mongodb
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async (req,res) => {
    // get user details from user
    // validation - not empty
    // check if user already exists - using username and email
    // check for images - avatar and coverimage
    // upload image to cloudinary, check for avatar
    // create user object - create entry in db
    // remove password and refresn token field from response 
    // check if user creation is successful
    // return response 

    const {fullname, username, email , password} = req.body;
    
    if (
        [fullname,username,email,password].some((fields)=> fields.trim() === "") // checking if all the fields are not empty
    ) {
        throw new ApiError(400,"All fields are required");        
    }

    const existingUser =  User.findOne({ // checking id user already exists with username and password
        $or : [ { username }, { email } ]
    }) 

    if (existingUser){
        throw new ApiError(409,"User with username or email already exits");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path; // we get the path uploaded by multer

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required"); // checking for avatar image
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // upload on cloudinary

    if(!avatar){
        throw new ApiError(400,"Avatar file is required"); // checking if avatar is uploaded successfully on cloudinary
    }

    const user = await User.create({       // create user
        fullname: fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email : email,
        password : password,
        username : username.toLowerCase()
    });

    const isUserCreated = await user.findById(user._id).select(  //  we try to find if the user is created and we select all the fields except password and refreshtoken 
        "-password -refreshToken"
    )

    if(!isUserCreated){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, isUserCreated , "User registered successfully"));


} );

const loginUser = asyncHandler( (req,res) => {
    res.status(200).json({
        message : "User Logged in Successfully"
    })
} );

export {
    registerUser,
    loginUser
} ;