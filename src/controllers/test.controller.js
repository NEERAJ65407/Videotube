import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const test = asyncHandler( async(req,res)=>{
    
    const query = "i want a video";
    const keyWords =  query.split(" ");

    if( ! keyWords ){
        
        const allVideos = await Video.aggregate([
            {
                "$lookup": {
                  "from": "users",
                  "localField": "owner",
                  "foreignField": "_id",
                  "as": "ownerDetails"
                }
              },
              {
               "$addFields": {
                  "ownerDetails": { "$arrayElemAt": ["$ownerDetails", 0] },
                  "uploaded" : "$createdAt"
                }
            },
            {
              "$project": {
                "title": 1,
                "description": 1,
                "videoFile":1,
                "thumbnail": 1,
                "views":1,
                "ownerDetails.avatar": 1,
                "ownerDetails.username": 1,
                "uploaded" : 1
              }
            }
        ]);

        return res
        .status(200)
        .json(
            new ApiResponse(200,allVideos,"Videos fetched ")
        )
    }

    const searchedVideos = await Video.aggregate([
        {
          "$addFields": {
            "lowercaseTitle": { "$toLower": "$title" },
            "lowercaseDescription": { "$toLower": "$description" },
            "titleArray": { "$split": ["$title", " "] },
            "descriptionArray": { "$split": ["$description", " "] }
          }
        },
        {
          "$match": {
            "$or": [
              { "titleArray": { "$in": queryComponents } },
              { "descriptionArray": { "$in": queryComponents } }
            ]
          }
        },
        {
            "$lookup": {
              "from": "users",
              "localField": "owner",
              "foreignField": "_id",
              "as": "ownerDetails"
            }
          },
          {
           "$addFields": {
              "ownerDetails": { "$arrayElemAt": ["$ownerDetails", 0] },
              "uploaded" : "$createdAt"
            }
        },
        {
          "$project": {
            "title": 1,
            "description": 1,
            "videoFile":1,
            "thumbnail": 1,
            "views":1,
            "ownerDetails.avatar": 1,
            "ownerDetails.username": 1,
            "uploaded" : 1
          }
        }
      ]);
      
      

    return res
    .status(200)
    .json(
        new ApiResponse(200,searchedVideos,"videos Retrived")
    )
})

export default test