import {Router} from 'express';
import { 
    registerUser , 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentUserPassword, 
    getUser, 
    updateUserAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage ,
    getUserChannelProfile, 
    getUserWatchHistory,
    deleteUser
} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middelware.js';

const router = Router();

router.route("/register").post(
    upload.fields([ //used when we want to take multiple files  // this is the multer middleware
        {
            name : "avatar",  //the input field name must also be avatar in frontend
            maxCount : 1
        },
        {
            name : "coverImage", //the input field name must also be coverImage in frontend
            maxCount : 1
        }
    ]),
    registerUser);
    
router.route("/login").post(loginUser);

//secured route

router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentUserPassword);
router.route("/").get(verifyJWT,getUser);
router.route("/").delete(verifyJWT,deleteUser);
router.route("/updateAccountDetails").patch(verifyJWT,updateUserAccountDetails);
router.route("/updateAvatar").patch(upload.single("avatar"),verifyJWT,updateUserAvatar);
router.route("/updateCoverImage").patch(upload.single("coverImage"),verifyJWT,updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getUserWatchHistory);

export default router;