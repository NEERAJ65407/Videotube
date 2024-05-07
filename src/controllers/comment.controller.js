import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;
    
    const skip = (page-1) * limit;
    
    const comments = await Comment.find({video:videoId})
    .skip(skip)
    .limit(limit)
    
    const totalCount = await Comment.countDocuments({video:videoId});

    const totalPages = Math.ceil(totalCount/limit);

    
    return res.status(200).json({
        success: true,
        data: {
            comments,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages
            }
        }
    });
});

const addComment = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params;

    const {comment} = req.body;
    
    if( !videoId){
        throw new ApiError(400,"Video id is required");
    }

    if( !comment){
        throw new ApiError(400,"comment is required");
    }
    
    const newComment = await Comment.create({

        content : comment,
        video : videoId,
        owner : req.user.id

    },{timestamps:true})
    
    if(!newComment){
        throw new ApiError(500,"Error while adding comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,newComment,"Comment has been added successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params;

    const {comment} = req.body;

    if ( !comment || comment === null ) {
        throw new ApiError(400,"Comment is required");
    }

    if ( !commentId) {
        throw new ApiError(400,"Comment id is missing");
    }

    const updatedComment = await Comment.updateOne({_id:commentId},{content:comment});

    if ( !updatedComment) {
        throw new ApiError(500,"Error while updating comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params;

    if( !commentId){
        throw new ApiError(400,"Comment id is required");    
    }

    const deletedComment = await Comment.deleteOne({_id:commentId});

    if ( !deletedComment ){
        throw new ApiError(500,"Error while deleting comment");
    }  

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedComment,"Comment has been deleted successfully")    
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }