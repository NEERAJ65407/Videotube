import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js'; // the user was created in the user model and can directly connect with mongodb
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';



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

    const avatar = await uploadOnCloudinary(avatarLocalPath, 'image');
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, 'image'); // upload on cloudinary

    if(!avatar){
        throw new ApiError(400,"Avatar file is required"); // checking if avatar is uploaded successfully on cloudinary
    }

    const user = await User.create({
    fullname: fullname,
    avatar: avatar.url,
    coverImage: coverImage.url? coverImage.url : " ",
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

    const deletedAvatar = await deleteFromCloudinary(oldAvatarUrl,'image'); //deleting the old avatar from cloudinary
   
    if(!deletedAvatar){
        throw new ApiError(400,"Old avatar deletion unsuccessful");
    }

    user.avatar = avatar.url; // setting new avatar url to database
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

    const deletedCoverImage = await deleteFromCloudinary(oldcoverImageUrl,'image'); //deleting the old cover image from cloudinary
   
    if(!deletedCoverImage){
        throw new ApiError(400,"Old Cover Image deletion unsuccessful");
    }

    user.coverImage = coverImage.url; // setting new cover image url to database
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing");
    }
    
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase() // we are finding the user details with particular username
            }
        },
        {
            $lookup: {
                from: "subscriptions", // we are selecting subscriptions collection
                localField: "_id",  // we select _id from users collection 
                foreignField: "channel", // we try to find the documents in which this id is present in channel field which will give us the subscribers of the channel
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id", // selecting _id of particular username
                foreignField: "subscriber",  // checking in what all documents this id is in subscriber field in the subscriptions collection which gives the channels this user has subscribed
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])


    if(!channel?.length){
        throw new ApiError(400,"Channel does not exist ");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})

const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user.id) // we generally get the string value of id from the req.user._id but we need mongodb object
            },// generally mongoose takes the string and converts it but during aggregation mongoose is not used so we have to create mongo object from string                                          
        },
        {
            $lookup : {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as : "watchHistory",
                pipeline : [ // we create a sub piple line so that we can retrive user data if we dont use subpipeline we cannot fetch user details afterwards
                    {
                        $lookup : {
                            from : "users",
                            localField: "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline : [{
                                $project : {
                                    fullname: 1,
                                    username :1,
                                    avatar:1 
                                }
                            }] 
                        }
                    },
                    {
                        $addFields : { 
                            owner : { // we overwrite the owner field and we extract the first element from array and make it into an object
                                $first :"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"The user watch history fetched successfully")
    )
})

const deleteUser = asyncHandler (async(req,res)=>{

    const {password} = req.body;

    const user = await User.findById(req.user.id);
    
    if( ! await user.isPasswordCorrect(password)){
        throw new ApiError(400,"Password is incorrect");
    }

    const deletedUserAvatarUrl = user.avatar;

    const deletedUserCoverImageUrl = user.coverImage;

    const deletedAvatar = await deleteFromCloudinary(deletedUserAvatarUrl,'image');

    const deletedCoverImage = await deleteFromCloudinary(deletedUserCoverImageUrl,'image');

    if( ! deletedAvatar){
        throw new ApiError(500,"Error while deleting avatar");
    }

    if( ! deletedCoverImage){
        throw new ApiError(500,"Error while deleting Cover image");
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $project: {
                _id: 1
            }
        }
    ]);
    
    for (const videoItem of videos) {
        try {
            const videoId = videoItem._id;
    
            const video = await Video.findById(videoId);
            if (!video) {
                throw new Error(`Video with ID ${videoId} not found`);
            }
    
            const { videoFile, thumbnail } = video;
    
            const deletedVideoFromCloudinary = await deleteFromCloudinary(videoFile, 'video');
            const deletedThumbnailFromCloudinary = await deleteFromCloudinary(thumbnail, 'image');
    
            if (!deletedVideoFromCloudinary) {
                throw new ApiError(500,`Error while deleting video ${videoId} from Cloudinary`);
            }
            if (!deletedThumbnailFromCloudinary) {
                throw new ApiError(500,`Error while deleting thumbnail ${videoId} from Cloudinary`);
            }
    
            const deletedVideo = await Video.deleteOne({ _id: videoId });
            if (!deletedVideo.deletedCount) {
                throw new Error(`Error while deleting video ${videoId}`);
            }
    
            
        } catch (error) {
            console.error(error.message);
        }
    }
    
    const deletedUser = await user.deleteOne({_id:req.user.id})
    
    if (!deletedUser){
        throw new ApiError(500,"Error while deleting user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User account deleted successfully")
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
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
    deleteUser

} ;