import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'; // the user was created in the user model and can directly connect with mongodb
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = await refreshToken;
        await user.save({validateBeforeSave : false}); //in order to handle the error that is password is required

        console.log(user);
        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token");
    }
}


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

    const existingUser =  await User.findOne({ // checking id user already exists with username and password
        $or : [ { username }, { email } ]
    }) 

    if (existingUser){
        throw new ApiError(409,"User with username or email already exits");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; // we get the path uploaded by multer

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0].path;
    } // we check if coverimage is uploaded or not

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required"); // checking for avatar image
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // upload on cloudinary

    if(!avatar){
        throw new ApiError(400,"Avatar file is required"); // checking if avatar is uploaded successfully on cloudinary
    }

    const user = await User.create({
    fullname: fullname,
    avatar: avatar,
    coverImage: coverImage? coverImage : " ",
    email: email,
    password: password,
    username: username.toLowerCase()
});


    const isUserCreated = await User.findById(user._id).select(  //  we try to find if the user is created and we select all the fields except password and refreshtoken 
        "-password -refreshToken"
    )

    if(!isUserCreated){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, isUserCreated , "User registered successfully"));
    

} );

const loginUser = asyncHandler( async (req,res) => {
    
    // get data from body
    // username or email
    // find the user 
    // password check 
    // generate and send access and refresh token to user
    // send cookies

    const {username, email, password} = req.body;  // get data from body

    if (!username && !email) {
        throw new ApiError(400,"Username or Email is required");
    } 

    const user = await User.findOne({
        $or: [
            { email: email }, // Find by email
            { username: username } // Find by username
        ]
    });
    
    if (!user) {
        throw new ApiError(404,"User does not exist");
    } // checking if user exists

    const isPasswordValid = await user.isPasswordCorrect(password); // our custom method to check if password is correct defined in the user model 

    if (!isPasswordValid) {
        throw new ApiError(401,"Password is incorrect");
    } // checking if password is correct

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id); // generating accesstoken and refresh token
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,  //cookie can only be modifies from server and not frontend
        secure: true
    }

    return res.
    status(200).
    cookie("accessToken",await accessToken,options). // setting accessToken cookie
    cookie("refreshToken",await refreshToken,options). // setting refreshToken cookie
    json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken: await accessToken , refreshToken : await refreshToken // providing the user so that he can store these details in local system
            },
            "Logged in sucessfully"
        )
    )

} );

const logoutUser = asyncHandler(async(req, res) => {
   
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the refreshToken field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options) // removing the tokens from the cookies so that the user is completely removed
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler( async (req,res,) => {
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken; //extracting the refresh token from the cookies
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }
    
    const decodedTokenData = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if(!decodedTokenData){
        throw new ApiError(400,"Invalid refresh token");
    }
    
    const user = await User.findById(decodedTokenData?._id);
    
    if(!user){
       throw new ApiError(400,"Invalid refresh token");
    }
    
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(400,"Refresh token doesnot match refresh token in database");
    } 
        
    const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    const options = {
            httpOnly: true,
            secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken",await accessToken,options)
    .cookie("refreshToken",await newrefreshToken,options)
    .json(
        new ApiResponse(200,{
            accessToken:await accessToken,
            refreshToken:await newrefreshToken
          })
    )
})


const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
    
    const {oldPassword, newPassword, confirmPassword} = req.body;

    const user = await User.findOne({_id : req.user?._id}); // we will use auth middleware so we will get the user from req.user

    if(newPassword !== confirmPassword){
        throw new ApiError(400,"The confirm password and the new password must match");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword;// updating the user password
    await user.save({validateBeforeSave:false}); // saving the changes

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password has been changed successfully")
    )

})

const getUser = asyncHandler(async(req,res)=>{

    const user = req.user;

    return res
    .status(200)
    .json(
        new ApiResponse(200,{
           username : user.username,
           name : user.fullname,
           email : user.email,
           watchHistory : URLSearchParams.watchHistory
        })
   )
})
        
const updateUserAccountDetails = asyncHandler(async(req,res)=>{
    
    const {fullname} = req.body;
    
    const user = await User.findByIdAndUpdate(req.user?._id, { fullname:fullname },{new : true}).select("-password -refreshToken");
   
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Full name changed successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath = req.file?.path;  // when we upload file through multer we can access the it through req.file for muktiple files it is req.files

    if( !avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath); // using function to upload the file to cloudinary and get url as response
    
    if(!avatar){
        throw new ApiError(400,"Error while uploading on Cloudinary");
    }

    const user = await User.findById(req.user?._id).select("-password -refreshtoken -watchHistory"); 

    const oldAvatarUrl = user.avatar; // getting url of old avatar from db 

    const deletedAvatar = await deleteFromCloudinary(oldAvatarUrl); //deleting the old avatar from cloudinary
   
    if(!deletedAvatar){
        throw new ApiError(400,"Old avatar deletion unsuccessful");
    }

    user.avatar = avatar; // setting new avatar url to database
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{

    const coverImageLocalPath = req.file?.path;  // when we upload file through multer we can access the it through req.file for multiple files it is req.files

    if( !coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing");
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // using function to upload the file to cloudinary and get url as response
    
    if(!coverImage){
        throw new ApiError(400,"Error while uploading on Cloudinary");
    }

    const user = await User.findById(req.user?._id).select("-password -refreshtoken -watchHistory"); 

    const oldcoverImageUrl = user.coverImage; // getting url of old cover image from db 

    const deletedCoverImage = await deleteFromCloudinary(oldcoverImageUrl); //deleting the old cover image from cloudinary
   
    if(!deletedCoverImage){
        throw new ApiError(400,"Old Cover Image deletion unsuccessful");
    }

    user.coverImage = coverImage; // setting new cover image url to database
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getUser,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

} ;