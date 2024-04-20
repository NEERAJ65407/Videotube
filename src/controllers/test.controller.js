import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const test = asyncHandler( async(req,res)=>{
    
    const videos = await Video.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $project : {
                _id :1
            }
        }
    ])

    const count = videos.length;
    
    for (let i = 0 ; i< count ;i++){
        
        const videoId = videos[i];

        const video = await Video.findById(videoId);
        
        const deletedVideoUrl = video.videoFile;

        const deletedThumbnailUrl = video.thumbnail;

        const deletedVideoFromCloudinary = await deleteFromCloudinary(deletedVideoUrl,'video');

        const deletedThumbnailFromCloudinary = await deleteFromCloudinary(deletedThumbnailUrl,'image');
        
        if( !deletedVideoFromCloudinary){
            throw new ApiError(500,`Error while deleting video ${videoId} from cloudinary `);
        }
        if( !deletedThumbnailFromCloudinary){
            throw new ApiError(500,`Error while deleting thumbnail ${videoId} from cloudinary `);
        }

        const deletedVideo = await Video.deleteOne(videoId);
        
        if( !deletedVideo){
            throw new ApiError(500,`Error while deleting ${videoId} `);
        }
    }
    return res
        .status(200)
        .json(
        {delvideos:videos,
        count:count})
})

export default test