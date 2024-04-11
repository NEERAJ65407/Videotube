import express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ //used to connect frontend and backend
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({
    limit:"16kb" //to get data from form or body
}));

app.use(express.urlencoded({extended:true,limit:"16kb"}));//get data from url by decoding it 
app.use(express.static("Public")); //used to configure public file 
app.use(cookieParser());

//routes

import userRouter from './routes/user.routes.js';


//route declaration 
app.use("/api/v1/users", userRouter);

export {app};

