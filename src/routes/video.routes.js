import {Router} from 'express';
import { publishAVideo, getVideoById, updateVideo, deleteVideo,togglePublishStatus } from '../controllers/video.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middelware.js';

const router = Router();

router.use(verifyJWT);

router.route("/publish-video").post(
    upload.fields([ //used when we want to take multiple files  // this is the multer middleware
        {
            name : "video",  //the input field name must also be avatar in frontend
            maxCount : 1
        },
        {
            name : "thumbnail", //the input field name must also be coverImage in frontend
            maxCount : 1
        }
    ]),publishAVideo);
router.route("/v/:videoId").get(getVideoById);
router.route("/update-video/:videoId").post(upload.single("thumbnail"),updateVideo);
router.route("/delete-video/:videoId").post(deleteVideo);
router.route("/toggle-publish-status/:videoId").post(togglePublishStatus);

export default router;