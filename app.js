//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const findOrCreate = require('mongoose-findorcreate')


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//setting up to use passport and session
app.use(session({
    secret: "Our Little Secret That i will use to session",
    resave: false,
    saveUninitialized: false
}));
//setting up to use passport and session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin:admin@secretsdb.f8njcbg.mongodb.net/");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});
//setting up to use passport and session
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
//setting up to use passport and session
passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});
//Using passport.js googlestratedgy in order to sign in with google and get profile
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://secretsappl.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//Using passport.js facebookstratedgy in order to sign in with facebook and get profile
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "https://secretsappl.herokuapp.com/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home");
});
//authenticating users that loging in with google and facebook and redirect them to secrets page
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});
app.get("/secrets", function(req,res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (err){
            console.log(err);
        }
        else{
            res.render("secrets", {usersWithSecrets: foundUsers})
        }
    })
});

app.get("/submit", function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err) {
        if (err) { 
            console.log(err);
        }
        res.redirect('/');
      });
});

//register the user using the packeges and authenticate the user using passport package,
//creating a cookie so when the user register he will be authenticated as long as he hasnt closed his browser
//which means he will be able to get to secrets page with no need to log in every time he try
app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

//login the user if the details that he gave match the database and authenticate him with the same principle in lined 72-74
app.post("/login", function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/submit", function(req,res){
    const submittedSecret = req.body.secret;

    console.log(req.user.id);
    User.findById(req.user.id, function(err, foundUser){
        if (err){
            console.log(err);
        }
        else{
            if (foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
 
app.listen(port, function() {
  console.log("Server started succesfully");
});  