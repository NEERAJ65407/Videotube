import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    
    const {channelId} = req.params
    
    if (!channelId){
        throw new ApiError(400,"Channel id not found");
    }

    const subscribedChannel = await Subscription.findOne({$and : [{channel: new mongoose.Types.ObjectId(channelId)},{subscriber:req.user._id}]});
    
    if( subscribedChannel){
        const unsubscribe = await Subscription.deleteOne({_id:subscribedChannel.id});
        
        if(!unsubscribe){
            throw new ApiError(400,"Error while unsubscribing");
        }   
        
        return res.
        status(200)
        .json(
            new ApiResponse(200,unsubscribe,"Channel has been unsubscribed successfully")
        )
    }

    const newSubscriber = await Subscription.create({
        channel:channelId,
        subscriber:req.user.id 
    })
    
    if(!newSubscriber){
        throw new ApiError(400,"Error while subscribing");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedChannel,"Channel has been subscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(200,"Channel id is required");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match :{
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup :{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as:"Subscriber"
            }
        },
        {
            $project: {
                "Subscriber.username": 1,
                "Subscriber.email": 1,
                
            }
        }
    ])

    if(! subscribers){
        throw new ApiError(500,"Error while fetching subscribers");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers,"The subscribers have been fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    const {subscriberId} = req.params

    if(!subscriberId){
        throw new ApiError(200,"Channel id is required");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match :{
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup :{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as:"SubscribedChannel"
            }
        },
        {
            $project: {
                "SubscribedChannel.username": 1,
                "SubscribedChannel.email": 1,
                
            }
        }
    ])
    
    if(! subscribedChannels){
        throw new ApiError(500,"Error while fetching subscribed channels");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedChannels,"The subscribed channels have been fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}