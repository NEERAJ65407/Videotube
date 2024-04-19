import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    
    const {name, description} = req.body

    if (!name){
        throw new ApiError(400,"Playlist name is required");
    }

    if (!description){
        throw new ApiError(400,"Playlist description is required");
    }

    const playlist = await Playlist.create({
        name : name,
        description : description,
        owner : req.user.id
    })

    if (!playlist){
        throw new ApiError(500,"Error while creating playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist created successfully")
    )
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    
    const {userId} = req.params
    
    if(!userId){
        throw new ApiError(400,"User id is required");
    }
   
    const userPlaylists = await Playlist.aggregate([{
        $match : {
            owner : new mongoose.Types.ObjectId(userId)
        }
    }])
    
    if(!userPlaylists){
        throw new ApiError(400,"No playlists found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,userPlaylists,"Playlist found")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params
    
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    const playlist = await Playlist.findById(playlistId);
    
    if(!playlist){
        throw new ApiError(500,"Error while fetching playlist");
    }

    if(!playlist.public){
        
        if(playlist.owner.toString()!== req.user?.id){
            throw new ApiError(404,"You cannot access a private playlist");
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Successfully fetched playlist")
    )
  
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params

    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    if(!videoId){
        throw new ApiError(400,"Video id is required");
    }

    const video = await Video.findById(videoId);
    
    if( video !== null && req.user.id !== video.owner.toString()){
        throw new ApiError(400,"You're unable to include videos in the playlist since you're not the owner");
    }

    if(!video){
        throw new ApiError(400,"Video not found");
    }

    const playlist = await Playlist.updateOne(
        { _id: playlistId, videos: { $ne: videoId } }, // Check if videoId is not already present
        { $push: { videos: videoId } } // Add videoId to videos array if not present
      );
    
    if(!playlist){
        throw new ApiError(500,"Unable to add Video to playlist");
    }

    if(!playlist.modifiedCount){
        throw new ApiError(400,"Video already in playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistId,"Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params
    
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    if(!videoId){
        throw new ApiError(400,"Video id is required");
    }

    const removedVideo = await Playlist.updateOne({},{ $pull:{ videos: { $eq: videoId }}});

    if(!removedVideo){
        throw new ApiError(400,"Video not found in playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,removedVideo,"Video removed successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {

    const {playlistId} = req.params
    
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    const isOwner = await Playlist.aggregate([{
        $match : {
            owner : new mongoose.Types.ObjectId(req.user?.id)
        }
    }]) 

    if(!isOwner){
        throw new ApiError(404,"You are not authorized to access publish functionality");
    }

    const playlist = await Playlist.findOneAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(400,"Error while deleting playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist has been deleted successfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params
    
    const {name, description} = req.body
    
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    if(!name && !description){
        throw new ApiError(400,"Name or Description is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400,"Playlist not found");
    }

    if( name!== undefined && name.trim() ){
        playlist.name = name;
    }

    if( description!== undefined && description.trim() ){
        playlist.description = description;
    }

    await playlist.save();
    
    return res
    .status(200)
    .json(
        new ApiError(200,playlist,"Playlist updated successfully")
    )
})

const togglePublishStatus = asyncHandler(async(req,res)=>{

    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400,"Playlist id is required");
    }

    const playlist = await Playlist.findOne({_id:playlistId , owner: req.user._id })
    
    if(!playlist){
        throw new ApiError(404,"You are not authorized to access publish functionality");
    }

    playlist.public = !playlist.public;
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist status changed successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    togglePublishStatus
}