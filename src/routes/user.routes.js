import {Router} from 'express';
import { registerUser , loginUser } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';

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

export default router;