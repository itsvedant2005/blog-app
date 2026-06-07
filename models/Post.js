const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({

    title:String,

    author:String,

    category:String,

    featuredImage:String,

    introduction:String,

    section1Title:String,
    section1Content:String,
    section1Image:String,

    section2Title:String,
    section2Content:String,
    section2Image:String,

    section3Title:String,
    section3Content:String,
    section3Image:String,

    conclusion:String,

    likes:{
        type:Number,
        default:0
    },

    comments:[
        {
            username:String,
            text:String
        }
    ],

    createdAt:{
        type:Date,
        default:Date.now
    },

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

});

module.exports = mongoose.model("Post", PostSchema);