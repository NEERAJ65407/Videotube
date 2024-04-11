import mongoose from 'mongoose';

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'; //used to write aggregate pipelines in mongodb

const videoSchema = mongoose.Schema({
    videoFile : {
        type : String,
        required : true
    },
    thumbnail : {
        type : String,
        required : true
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    duration : {
        type : Number,
        required : true
    },
    views : {
        type :Number,
        default : 0
    },
    isPublished : {
        type : Boolean,
        default : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

},{
    timeStamps:true
})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema); 