import {v2 as cloudinary} from 'cloudinary'; //we upload file from local system to multer and from multer it is uploaded to cloudinary and it gives an url 
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath){
            return err = new Error("File path not found");
        }
        
        //uploading file on coudinary 
        const uploadResponse = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
        
        fs.unlinkSync(localFilePath); // file is removed from localstorage on server after file is uploaded successfully on cloudinary
        return uploadResponse ; // returning the fileurl provided by cloudinary to user
    
    } catch (error){
    
        fs.unlinkSync(localFilePath); //removing file from local storage if upload operation fails 
    
        return null;
    }
}

const deleteFromCloudinary = async (url) =>{
    try {
        const parts = url.split('/');
        const filename = parts.pop().split('.')[0];
        const fullpublicId = parts.pop() + '/' + filename;
        const publicId = fullpublicId.split("/")[1]; // the public id is extracted from the url 
        const deletionResponse = await cloudinary.uploader.destroy(publicId); // the public id used to remove the avatar 
        return deletionResponse;
        
    } catch (error) {
        return null
    }
}

export {uploadOnCloudinary , deleteFromCloudinary}