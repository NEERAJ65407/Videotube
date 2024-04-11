import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; //for hashing passwords
import jwt from 'jsonwebtoken'; //authentication 

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

userSchema.methods.isPasswordCorrect = async function(password){ // creating a custom function to check password
    return await bcrypt.compare(password,this.password); //compares the given password and encrypted password
} 

userSchema.methods.generateAccessToken = async function(){ // creating a custom function to generate accesstoken 
    return await jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    ) 
}

userSchema.methods.generateRefreshToken = async function(){ // creating a custom function to generate refreshtoken 
    return await jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    ) 
}

userSchema.pre('save', async function (next) {//prehook to encrpyt password before saving in db if password is modified
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
})


export const User = mongoose.model("User",userSchema);