
require("dotenv").config();
console.log(process.env.SECRET)
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');


const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(encrypt, {secret:process.env.SECRET,encryptedFields:["password"]} );

const User = new mongoose.model("User", userSchema);



app.get("/", function(req,res){
    res.render("home");
});
app.get("/register", function(req,res){
    res.render("register");
});
app.get("/login", function(req,res){
    res.render("login");
});

app.post("/register",function(req,res){
    const newUser = new User({email:req.body.username,
    password:req.body.password});
    newUser.save().then(function(a){
        res.render("secrets");
    }).catch(function(err){
        console.log(err);
    });
});

app.post("/login",async function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    try{
        const foundUser= await User.findOne({email:username});
        if (foundUser){
            if(foundUser.password===password){
                res.render("secrets");
            }else{
                console.log("wrong password.")
            }
        }
    }catch(err){
        console.log(err);
    }
    


});








app.listen(3000,function(){
    console.log("server started.")
});
