import {Router} from 'express';
import { registerUser , loginUser, logoutUser } from '../controllers/user.controller.js';
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

export default router;