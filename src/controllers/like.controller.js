import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    
    if( !videoId ){
        throw new ApiError(400,"Video id is required");
    }

    const like = await Like.findOne({ video: videoId});

    if(!like){
        
        const video = await Like.create({
            video : videoId,
            likedBy : req.user.id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,video,"Video liked successfully")
        )
    } else {

        const video = await Like.deleteOne({
            video : videoId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,video,"like removed successfully")
        )
    }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    
    if( !commentId ){
        throw new ApiError(400,"Comment id is required");
    }

    const like = await Like.findOne({ comment: commentId});

    if(!like){
        
        const comment = await Like.create({
            comment : commentId,
            likedBy : req.user.id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,comment,"Comment liked successfully")
        )
    } else {

        const comment = await Like.deleteOne({
            comment : commentId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,comment,"like removed successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const videos = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $lookup :{
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videos"
            }
        },
        {
            $unwind : "$videos"
        },
        {
            $project : {
                "videos.title":1
            }
        }
    ])
    
    if( !videos) {
        throw new ApiError(400,"No liked videos");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"Liked videos fetched successfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}

