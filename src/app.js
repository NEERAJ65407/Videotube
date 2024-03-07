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
}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))//get data from url 

app.use(express.static("Public"))

app.use(cookieParser())

export {app};

