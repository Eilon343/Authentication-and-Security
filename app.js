//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//using md5 to turn the user's password to a hash function in order to secure the password better and getting rid of encryption
const md5 = require('md5');
// const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

//this used in order to encrypt my database with a variable "secret" which is just a long string
//that will be the key to decrypt the database so i can fecth password and the user will be able to login
//the secret varible stored in a .env file so that itll be secured and no one but me would be able to see it
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.post("/register", function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }
        else{
            console.log(err);
        }
    });
});

app.post("/login", function(req,res){
    const username = req.body.username;
    //using md5 on login password in order to compare it with the hash that created when user registerd
    const password = md5(req.body.password);
    User.findOne({email: username}, function(err, foundUser){
        if (err){
            console.log(err);
        }
        else{
           if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
           } 
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});