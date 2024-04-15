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

// each document contains a channel and a subscriber
// users a b c d e
// channel CAC HCC FCC 
// when a subscribes to CAC a document with a in subcriber field  and CAC in channel field
// when b subscribes to CAC a document with b in subcriber field  and CAC in channel field
// when b subscribes to HCC a document with b in subcriber field  and HCC in channel field
// when b subscribes to FCC a document with b in subcriber field  and FCC in channel field
// when we want to find number of subscribers of a channel we just count the documents with the particular channel in channel field
// when we want to find no of channels subscribed for each user we just count the no of documents that have the particular user in the user field and we can also find the channels   