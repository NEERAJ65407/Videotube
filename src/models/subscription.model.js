import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subscriber : {
        type : mongoose.Schema.Types.ObjectId, //person who is subscribing
        ref : "User"
    },
    channel : {
        type : mongoose.Schema.Types.ObjectId, //person who is getting subscribed by a subscriber
        ref : "User"
    },

},
{
    timestamps : true
})

export const Subscription = mongoose.model("Subscription",subscriptionSchema);