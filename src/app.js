import express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();

app.use(cors({ //used to connect frontend and backend
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(bodyParser.json({
    limit:"16kb" //to get data from form or body
}));

app.use(bodyParser.urlencoded({extended:true,limit:"16kb"}));//get data from url by decoding it 
app.use(express.static("Public")); //used to configure public file 
app.use(cookieParser());

//routes

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//route declaration 
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/dashboard", dashboardRouter);
     
export {app};

