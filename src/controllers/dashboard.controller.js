import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const user = req.user.id;

    const views = await Video.find({owner: user},{views : 1});

    const subscriberCount = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(user)
            }
        },{
            $group : {
                _id : null,
                subscriberCount : {
                    $sum : 1
                }
            }
        },
        {
            $project :{
                subscriberCount :1
            }
        }
    ])
    
    const videoCount = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(user)
            }
        },
        {
            $group : {
                _id : null,
                videoCount : {
                    $sum : 1
                }
            }
        },
        {
            $project : {
                videoCount : 1
            }
        }
    ])
    
    const likeCount = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(user)
            }
        },
        {
            $group : {
                _id : null,
                likeCount : {
                    $sum : 1
                }
            }
        },
        {
            $project : {
                likeCount : 1
            }
        }
    ])

    return res
    .status(200)
    .json({
        "views": views,
        "subscribers" : subscriberCount,
        "videos" : videoCount,
        "likes" : likeCount
})

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }