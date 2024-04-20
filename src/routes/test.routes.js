import {Router} from 'express';
import test from '../controllers/test.controller.js'
import { verifyJWT } from "../middlewares/auth.middelware.js";
const router = Router();
router.use(verifyJWT)
router.route("/").get(test)

export default router