import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    username : { 
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true //to optimise searching
    },
    email : { 
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullname : { 
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type : String, //cloudinary url 
        required : true 
    },
    coverImage : {
        type : String 
    },
    watchHistory : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    }],
    password : {
        type : String,
        required : [true,'Password is required']
    },
    refreshToken : {
        type : String
    }



},{
    timestamps : true
})


export const User = mongoose.model("User",userSchema);