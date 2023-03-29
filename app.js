
require("dotenv").config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport")
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true
}));
app.use(express.static("public"));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');


const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret :String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user);
  });
 
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try{
        const foundUser = await User.findOne({ googleId:profile.id});
        if (foundUser){
            console.log(profile);
            return cb(null,foundUser);
        }else {
            const newUser = new User({
                googleId:profile.id
            });
            const savedUser = await newUser.save();
            return cb(null,savedUser);
        }
    }catch(err){
        return cb(err);
    } 
  }
));


app.get("/", function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));


  app.get("/register", function(req,res){
    res.render("register");
});

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login", function(req,res){
    res.render("login");
});
app.get("/secrets",(req,res)=>{
    let auth =false;
    if (req.isAuthenticated()){
        auth = true;
    }else {auth=false;}
    User.find({"secret":{$ne:null}}).then(fUsers=>{
        if (fUsers){
            res.render("secrets", {usersWithSecrets:fUsers,auth:auth});
        }
    }).catch(a=>{console.log(err);});
    
    
});
app.get("/submit",function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login");
    }
});

app.post("/submit",(req,res)=>{
    const submittedSecret=req.body.secret;
    User.findById(req.user._id).then((foundUser)=>{
        
        foundUser.secret = submittedSecret;
        foundUser.save().then(a=>{
            res.redirect("/secrets");
        }).catch(err=>{
            console.log(err)
        });
    }).catch((err)=>{
        console.log(err);
    });

    

});



app.post("/register", async (req, res) => {
	try {
		const registerUser = await User.register(
                    {username: req.body.username}, req.body.password
                );
		if (registerUser) {
			passport.authenticate("local") (req, res, function() {
				res.redirect("/secrets");
			});
		} else {
			res.redirect("/register");
		}
	} catch (err) {
		res.send(err);
	}
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/secrets",
    failureRedirect: "/login"
}), function(req, res){
    
});

// req.logout() needs a callback:
app.get("/logout", (req, res, next) => {
	req.logout(function(err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});




/////deneme



app.listen(3000,function(){
    console.log("server started.")
});
