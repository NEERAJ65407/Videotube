import {Router} from "express";
import {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels} from "../controllers/subscription.controller.js";
import {verifyJWT} from "../middlewares/auth.middelware.js"

const router = Router();

router.use(verifyJWT);

router.route("/toggle-subscription/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/subscribed-channels/:subscriberId").get(getSubscribedChannels);
export default router 