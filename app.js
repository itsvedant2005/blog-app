const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");



require("dotenv").config();

const auth = require("./middleware/auth");
const User = require("./models/User");
const Post = require("./models/Post");

const app = express();
const PORT = process.env.PORT || 5000;
//Image
const multer = require("multer");

const storage = multer.diskStorage({

    destination:function(req,file,cb){
        cb(null,"uploads/");
    },

    filename:function(req,file,cb){
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({
    storage
});

/* ---------------- MONGODB CONNECTION ---------------- */

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch(err => {
    console.error("❌ MongoDB Error:", err);
});

/* ---------------- MIDDLEWARE ---------------- */

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(express.static("public"));

app.use(session({

    secret: "blogsecret",

    resave: false,

    saveUninitialized: false

}));

/* ---------------- VIEW ENGINE ---------------- */

app.set("view engine", "ejs");

/* ---------------- TEMP POSTS ARRAY ---------------- */

let posts = [];

/* ---------------- HOME PAGE ---------------- */

app.get("/", async (req, res) => {

    try {

        const posts = await Post.find().sort({ createdAt: -1 });

        res.render("index", {
            posts,
            user: req.session.user || null
        });

    } catch (err) {

        console.log(err);

        res.send("Error loading home page");

    }

});

/* ---------------- CREATE PAGE ---------------- */

app.get("/create", auth, (req,res)=>{

    res.render("create");

});

/* ---------------- ADD POST ---------------- */

// app.post("/posts", upload.single("image"), async (req,res)=>{

//     console.log(req.body);

//     const post = new Post({
//         title:req.body.title,
//         content:req.body.content,
//         category:req.body.category,
//         image:req.file ? req.file.filename : null
//     });

//     await post.save();

//     res.redirect("/");
// });

/* ---------------- REGISTER PAGE ---------------- */

app.get("/register",(req,res)=>{

    res.render("register");

});

/* ---------------- REGISTER USER ---------------- */

app.post("/register", async(req,res)=>{

    try{

        const { username, email, password } = req.body;

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = new User({

            username,
            email,
            password: hashedPassword

        });

        await user.save();

        res.redirect("/login");

    }catch(error){

        console.log(error);

        res.send("Registration Error");

    }

});

/* ---------------- LOGIN PAGE ---------------- */

app.get("/login",(req,res)=>{

    res.render("login");

});

/* ---------------- LOGIN USER ---------------- */

app.post("/login", async(req,res)=>{

    try{

        const { email, password } = req.body;

        // FIND USER
        const user = await User.findOne({ email });

        if(!user){

            return res.send("User not found");

        }

        // CHECK PASSWORD
        const match = await bcrypt.compare(password, user.password);

        if(!match){

            return res.send("Wrong Password");

        }

        // SAVE SESSION
        req.session.user = user;

        res.redirect("/");

    }catch(error){

        console.log(error);

        res.send("Login Error");

    }

});

/* ---------------- LOGOUT ---------------- */

app.get("/logout",(req,res)=>{

    req.session.destroy();

    res.redirect("/login");

});

/* ---------------- EDIT PAGE ---------------- */

app.get("/edit/:id", async (req, res) => {

    const post = await Post.findById(req.params.id);

    res.render("edit", { post });

});

/* ---------------- UPDATE POST ---------------- */

app.put("/posts/:id", async (req, res) => {

    await Post.findByIdAndUpdate(
        req.params.id,
        {
            title: req.body.title,
            author: req.body.author,
            content: req.body.content,
            category: req.body.category
        }
    );

    res.redirect("/");

});

/* ---------------- DELETE POST ---------------- */

app.delete("/posts/:id", async (req, res) => {

    await Post.findByIdAndDelete(req.params.id);

    res.redirect("/");

});

app.get("/post/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.send("Post not found");
        }

        res.render("post", { post });

    } catch (err) {
        console.log(err);
        res.send("Error loading post");
    }
});

/* ---------------- SERVER ---------------- */

app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);

});

/* ---------------- Image Route ---------------- */
app.post(
    "/posts",

    upload.fields([
        { name: "featuredImage", maxCount: 1 },
        { name: "section1Image", maxCount: 1 },
        { name: "section2Image", maxCount: 1 },
        { name: "section3Image", maxCount: 1 }
    ]),

    async (req, res) => {

        try {

            const post = new Post({

                title: req.body.title,

                author: req.body.author,

                category: req.body.category,

                featuredImage:
                    req.files.featuredImage?.[0]?.filename,

                introduction:
                    req.body.introduction,

                section1Title:
                    req.body.section1Title,

                section1Content:
                    req.body.section1Content,

                section1Image:
                    req.files.section1Image?.[0]?.filename,

                section2Title:
                    req.body.section2Title,

                section2Content:
                    req.body.section2Content,

                section2Image:
                    req.files.section2Image?.[0]?.filename,

                section3Title:
                    req.body.section3Title,

                section3Content:
                    req.body.section3Content,

                section3Image:
                    req.files.section3Image?.[0]?.filename,

                conclusion:
                    req.body.conclusion

            });

            await post.save();

            res.redirect("/");

        } catch (err) {

            console.log(err);

            res.send("Error creating post");

        }

    }
);


/* ---------------- Comment ---------------- */
app.post("/comment/:id", async (req, res) => {

    try {

        await Post.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        username: req.body.username,
                        text: req.body.text
                    }
                }
            }
        );

        res.redirect("/post/" + req.params.id);

    } catch(err) {

        console.log(err);

        res.redirect("/");

    }

});
/* ---------------- Like ---------------- */
app.post("/like/:id", async (req, res) => {

    try {

        await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } }
        );

        res.redirect("/post/" + req.params.id);

    } catch(err) {

        console.log(err);

        res.redirect("/");

    }

});

/* ---------------- Search---------------- */
app.get("/search", async (req, res) => {

    const keyword = req.query.keyword;

    const posts = await Post.find({
        category: keyword
    });

   res.render("index", {
    posts,
    user: req.session.user || null
});

});

/* ---------------- Category---------------- */
app.get("/category/:name", async(req,res)=>{

    const posts = await Post.find({
        category:req.params.name
    });

    res.render("index",{ posts });
});

/* ----------------Uploads---------------- */
app.use("/uploads", express.static("uploads"));
