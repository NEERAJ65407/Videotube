import {Router} from 'express';
import { publishAVideo, getVideoById, updateVideo, deleteVideo,togglePublishStatus,getAllVideos } from '../controllers/video.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middelware.js';

const router = Router();

router.use(verifyJWT);

    router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "video", //used when we want to take multiple files  // this is the multer middleware
                maxCount: 1,
            },
            {
                name: "thumbnail", //the input field name must also be thumbnail in frontend
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;