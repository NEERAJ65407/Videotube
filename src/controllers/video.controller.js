import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})

const publishAVideo = asyncHandler(async (req, res) => {
    
    const { title, description} = req.body;

    if (!title || !description){
        throw new ApiError(400,"Title and description are required");
    }
    
    const videoLocalPath = req.files?.video[0]?.path;
    
    if (! videoLocalPath){
        throw new ApiError(400,"Video is required")
    }

    const thumbnailLocalPath = req.files.thumbnail[0]?.path;

    if (! thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video) {
        throw new ApiError(400,"Error while uploading video on cloudinary");
    }

    if (!thumbnail) {
        throw new ApiError(400,"Error while uploading thumbnail cloudinary");
    }

    const newVideo = await Video.create({
        videoFile : video.url,
        thumbnail : thumbnail.url,
        title : title,
        description : description,
        duration : video.duration,
        isPublished : true,
        owner : req.user?._id
    })

    if(! newVideo) {
        throw new ApiError(500,"Error while uploading video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,newVideo,"The video has been published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params
    
    if(!videoId) {
        throw new ApiError(404,"Video Id not found");
    }

    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404,"Video not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video found")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params 

    const { title , description} = req.body;
    
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    
    const video = await Video.findById(videoId);

    const isOwner = await Video.aggregate([
        {
        $match : {
            owner : new mongoose.Types.ObjectId(req.user.id)
        }}
    ]);

    if(!isOwner.length > 0 ){
        throw new ApiError(401,"You are not authorized to update this video");
    }

    if( !title && !description && !thumbnailLocalPath){
        throw new ApiError(400,"Title thumbnail or description are needed to update the video");
    }

    if ( title !== undefined && title.trim() ){
        video.title = title;
        await video.save()
    }
   
    if ( thumbnailLocalPath !== undefined ){
        
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        
        if(!thumbnail){
            throw new ApiError(400,"Error uploading on cloudinary");
        }
        
        const deletedUrl = await deleteFromCloudinary(video.thumbnail);
        console.log(deletedUrl);
        if(!deletedUrl){
            throw new ApiError (400 , "Error while deleting old thumbnail from cloudinary");
        }

        video.thumbnail = thumbnail.url;
        await video.save(); 
    }

    if ( description !== undefined && description.trim()){
        video.description = description;
        await video.save();
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video details updated successfully")
    )

})
// fix deletion from cloud
const deleteVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400,"Video Id is required");
    }

    const video = await Video.findById(videoId);

    if (!video){
        throw new ApiError(400,"Video not found");
    }

    const isOwner = await Video.aggregate([{
        $match : {
            owner : new mongoose.Types.ObjectId(req.user.id)
        }
    }])

    if(!isOwner){
        throw new ApiError(401,"You are not authorized to delete this video");
    }

    const deletedVideoUrl = video.videoFile;
    const deletedThumbnailUrl = video.thumbnail;

    const deleteVideoFromCloud = await deleteFromCloudinary(deletedVideoUrl);
    
    const deleteThumbnailFromCloud = await deleteFromCloudinary(deletedThumbnailUrl);
    
    if(!deleteVideoFromCloud){
        throw new ApiError(400,"Error while deleting video from cloudinary");
    }

    if(!deleteThumbnailFromCloud){
        throw new ApiError(400,"Error while deleting thumbnail from cloudinary");
    }

    const deletedVideo = await Video.findOneAndDelete({_id:videoId});

    if(!deletedVideo){
        throw new ApiError(500,"Error while deleting video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedVideo,"The video has been successfully deleted")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,"Video Id is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found");
    }

    const isOwner = await Video.aggregate([{
        $match : {
            owner : new mongoose.Schema.Types.ObjectId(req.user?.id)
        }
    }]) 

    if(!isOwner){
        throw new ApiError(404,"You are not authorized to access publish functionality");
    }

    video.isPublished = !video.isPublished;
    await video.save();
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"The video publish status has been changed")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}