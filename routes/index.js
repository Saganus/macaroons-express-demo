var express     = require("express");
var router      = express.Router();
var MongoClient = require('mongodb').MongoClient;
var cookie      = require("cookie");

const crypto    = require("crypto");
const uuidv4    = require('uuid/v4');

var scrypt              = require("scrypt");
var scryptParameters    = scrypt.paramsSync(0.1);
var mAuthMint           = require("mauth").mAuthMint;

var serverId                = process.env.SERVER_ID;
var location                = "http://www.endofgreatness.net";
//var macaroonSecret            = "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";

//var thirdPartySecret  = "third-party secret";
//var identifier            = "random32";

var defaultCookieAge    = 1 * 60 * 60 * 1000;

router.get("/", function(req, res, next){
    res.render("login_form", {});
});

router.post("/register", function(req, res, next){

    var userId = req.body.userId;
    var pass = req.body.pass;

    if (typeof userId !== 'undefined' && userId !== '' 
        && typeof pass !== 'undefined' && pass !== '' ){
        registerNewUser(userId, pass, req.db)
            .then(function(){
                res.send("User " + userId + " successfully registered");
            }).catch(function(error){
                console.log(error);
                res.sendStatus("401");
            });
    }
    else{
        res.status(400).send('Bad Request: User or password field undefined or empty');
    }

});

router.post("/login", function(req, res, next){

    var userId = req.body.userId;
    var pass = req.body.pass;
    console.log("post /login router");
    console.log(userId);
    console.log(pass);
    if (typeof userId !== "undefined" && userId !== ""
        && typeof pass !== "undefined" && pass !== "" ){
        getAuthMacaroons(userId, pass, req.db)
            .then(function(authMacaroons){

                res.clearCookie("GET");
                res.clearCookie("POST");
                res.clearCookie("PUT");
                res.clearCookie("DELETE");

                res.cookie("GET", authMacaroons["GET"], { maxAge: defaultCookieAge, httpOnly: true });
                res.cookie("POST", authMacaroons["POST"], { maxAge: defaultCookieAge, httpOnly: true });
                res.cookie("PUT", authMacaroons["PUT"], { maxAge: defaultCookieAge, httpOnly: true });
                res.cookie("DELETE", authMacaroons["DELETE"], { maxAge: defaultCookieAge, httpOnly: true });

                console.log("redirecting");
                res.redirect('/restricted?userId='+userId);
            }).catch(function (error) {
                console.log("post(/login): getAuthMacaroons promise rejected:");
                console.log(error);
                res.sendStatus("401");
            });
    }
    else{
        res.sendStatus("401");
    }
});

router.post("/logout", function(req, res, next){
    var userId = req.body.userId;
    console.log("logging out user: " + userId);
    if (typeof userId !== "undefined" && userId !== ""){
        var collection = req.db.collection('ACEs');
        var macaroonSecret = crypto.randomBytes(32).toString('hex');
        collection.updateOne({userId: userId}, {$set: {macaroonSecret: macaroonSecret}})
            .then(function(updateResult){
                if(updateResult.result["ok"] == 1){
                    //res.clearCookie(serverId+"/GET");
                    //res.clearCookie(serverId+"/POST");
                    //res.clearCookie(serverId+"/PUT");
                    //res.clearCookie(serverId+"/DELETE");
                    res.send("Logged out successfully");
                }
                else{
                    console.log("User not found: " + userId);
                    res.sendStatus("401");
                }
        }).catch(function (error) {
            console.log("get(/logout): collection.updateOne Promise rejected:");
            console.log(error);
            res.sendStatus("401");
        });
    }
    else{
        res.sendStatus("401");
    }

    
});

function getAuthMacaroons(userId, pass, db){
    return new Promise((resolve, reject) =>{
        var collection = db.collection('ACEs');
        collection.findOne({userId : userId})
            .then(function(user){
                if(user !== null){
                    var isAuthenticated = scrypt.verifyKdfSync(Buffer.from(user.pass, "hex"), pass);
                    if(isAuthenticated){
                        console.log("isAuthenticated");

                        var mintPolicy      = user.mintPolicy;
                        var macaroonSecret  = mAuthMint.calculateMacaroonSecret(user.macaroonSecret);
                        authMacaroons       = mAuthMint.mintMacaroons(mintPolicy, location, macaroonSecret, user.identifier);

                        resolve(authMacaroons);
                    }
                    else{
                        var error = new Error("Authentication failed");
                        reject(error);
                    }
                }
                else{
                    var error = new Error("User not found: " + userId);
                    reject(error);
                }
            }).catch(function (error) {
                console.log("getAuthMacaroons: collection.findOne Promise rejected:");
                console.log(error);
                reject(error);
            });
    });
};


function registerNewUser(userId, pass, db){
    return new Promise((resolve, reject) => {
        var kdfResult   = scrypt.kdfSync(pass, scryptParameters);
        pass            = kdfResult.toString("hex");
        var userPolicy  = getUserPolicy(userId)

        var collection = db.collection('ACEs');

        collection.find({userId : userId}).count()
            .then(function(count){
                if(count > 0){
                    //res.status(403).send("Forbidden: Can\'t add user");
                    var error = new Error("Can\'t add existing user");
                    reject(error);
                }
                else{
                    var macaroonSecret = crypto.randomBytes(32).toString('hex');
                    var verifierPolicy = {
                        policyName: "default",
                        satisfyExact: [
                            {
                                name: "serverId",
                                value: process.env.SERVER_ID
                            },
                            {
                                name: "requestMethod",
                                value: req.method
                            }
                        ],
                        satisfyGeneral: [
                            {
                                name: "time"
                            },
                            {
                                name: "routes",
                            }
                        ]
                    };

                    var mintPolicy = {
                        policyName: "default",
                        baseCaveats: [
                            {
                                name : "serverId",
                                value: serverId
                            },
                            {
                                name : "expires",
                                value: 3
                            }
                        ],
                        perMethodCaveats: [
                            {
                                requestMethod: "GET",
                                caveats: [
                                    {
                                        name : "routes",
                                        value: "/restricted"
                                    }
                                    
                                ]
                            },
                            {
                                requestMethod: "POST",
                                caveats: [
                                    {
                                        name : "routes",
                                        value: "/restricted,/logout"
                                    }
                                ]
                            },
                        ]
                    };

                    try{
                        collection.insertOne({
                            userId: userId, 
                            pass: pass, 
                            verifierPolicy: verifierPolicy,
                            mintPolicy: mintPolicy,
                            macaroonSecret : macaroonSecret, 
                            identifier : uuidv4()}); 
                        resolve();
                    }cath(err){
                        console.log(err);
                        reject(err)
                    };

                    
                }
            }).catch(function (error) {
                console.log("Promise rejected:");
                console.log(error);
                reject(error);
            }); 
    });
    
};


function getMintPolicy(userId){

    var mintPolicy = {
        policyName: "default",
        baseCaveats: [
            {
                name : "serverId",
                value: serverId
            },
            {
                name : "expires",
                value: 3
            }
        ],
        perMethodCaveats: [
            {
                requestMethod: "GET",
                caveats: [
                    {
                        name : "routes",
                        value: "/restricted"
                    }
                    
                ]
            },
            {
                requestMethod: "POST",
                caveats: [
                    {
                        name : "routes",
                        value: "/restricted,/logout"
                    }
                ]
            },
        ]
    };
    return mintPolicy;
};

function getUserPolicy(userId){
    var userPolicy = {
        name : "memberAccess",
        description: "Access policy for members of the site",
        serverId : serverId,
        expires : 60*60*24,
        scopes : [
            {
                name : "restricted",
                routes : ["/restricted"],
                methods : ["GET", "POST"]
            },
            {
                name : "logout user",
                routes : ["/logout"],
                methods : ["POST"]
            }
        ]
    }

    return userPolicy
};


module.exports = router;
