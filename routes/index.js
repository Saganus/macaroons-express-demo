var express 	= require("express");
var router 		= express.Router();
var MongoClient = require('mongodb').MongoClient;
var cookie 		= require("cookie");

const crypto 	= require("crypto");
const uuidv4 	= require('uuid/v4');



var scrypt 				= require("scrypt");
var scryptParameters 	= scrypt.paramsSync(0.1);

var MacaroonsBuilder 	= require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier 	= require("macaroons.js").MacaroonsVerifier;

var MacaroonAuthUtils	= require("../utils/macaroon_auth.js");

var serverSecretKey     = process.env.SECRET_KEY;
var serverId 			= process.env.SERVER_ID;
var location 			= "http://www.endofgreatness.net";
//var secretKey 			= "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";

//var thirdPartySecret 	= "third-party secret";
//var identifier 			= "random32";



var defaultCookieAge 	= 1 * 60 * 60 * 1000;

var defaultPass = "pass";

/* GET home page. */
router.get("/", function(req, res, next) {
 	res.render("index", { title: "Express" });
});

router.get("/login", function(req, res, next){
	res.render("login_form", {});
});

router.post("/register", function(req, res, next){

	var user = req.body.user;
	var pass = req.body.pass;

	if (typeof user !== 'undefined' && user !== '' 
		&& typeof pass !== 'undefined' && pass !== '' ){
		registerNewUser(user, pass, req.db)
			.then(function(){
				res.send("User " + user + " successfully registered");
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

	var user = req.body.user;
	var pass = req.body.pass;

	if (typeof user !== 'undefined' && user !== '' 
		&& typeof pass !== 'undefined' && pass !== '' ){
		getAuthMacaroons(user, pass, req.db)
			.then(function(authMacaroons){

				res.cookie(serverId+"/GET", authMacaroons["GET"], { maxAge: defaultCookieAge, httpOnly: true });
				res.cookie(serverId+"/POST", authMacaroons["POST"], { maxAge: defaultCookieAge, httpOnly: true });
				res.cookie(serverId+"/PUT", authMacaroons["PUT"], { maxAge: defaultCookieAge, httpOnly: true });
				res.cookie(serverId+"/DELETE", authMacaroons["DELETE"], { maxAge: defaultCookieAge, httpOnly: true });

				res.send("Successfully logged in");
			}).catch(function (error) {
	            console.log("Promise rejected:");
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
				var isAuthenticated = scrypt.verifyKdfSync(Buffer.from(user.pass, "hex"), pass);
				if(isAuthenticated){
					var userPolicy = getUserPolicy(user.userId);

					const hash 			= crypto.createHash('sha256');
					hash.update(serverSecretKey + user.secretKey);
					var secretKey 		= Buffer.from(hash.digest("hex"), "hex");

					authMacaroons 		= MacaroonAuthUtils.generateMacaroons(userPolicy, location, secretKey, user.identifier);
					resolve(authMacaroons);
				}
				else{
					var error = new Error("Authentication failed");
					reject(error);
				}
			}, function(error){
  				console.log(error);
  				reject(error);
  			}).catch(function (error) {
                console.log("Promise rejected:");
                console.log(error);
                reject(error);
        	});
	});
};

/*
router.get("/logout", function(req, res, next){
	res.clearCookie(serverId+"/GET");
	res.clearCookie(serverId+"/POST");
	res.send("Logout successful");
});
*/

function registerNewUser(userId, pass, db){
	return new Promise((resolve, reject) => {
		var kdfResult 	= scrypt.kdfSync(pass, scryptParameters);
		pass 			= kdfResult.toString("hex");
		var userPolicy 	= getUserPolicy(userId)

	 	var collection = db.collection('ACEs');

	  	collection.find({userId : userId}).count()
	  		.then(function(count){
	  			if(count > 0){
	  				//res.status(403).send("Forbidden: Can\'t add user");
	  				var error = new Error("Can\'t add existing user");
	  				reject(error);
	  			}
	  			else{
		  			var secretKey = crypto.randomBytes(32).toString('hex');
			  		collection.insertOne({userId: userId, pass: pass, userPolicy: userPolicy, secretKey : secretKey, identifier : uuidv4()});	
			    	resolve();
		  		}
	  		}, function(error){
	  			console.log(error);
	  			reject(error);
	  		}).catch(function (error) {
	            console.log("Promise rejected:");
	            console.log(error);
	            reject(error);
	        });	
	});
	
};


function getUserPolicy(userId){
	var userPolicy = {
		name : "memberAccess",
		description: "Access policy for members of the site",
		serverId : serverId,
		expires : 60*60*24,
		scopes : [
			{
				name : "public",
				routes : ["/", "/login"],
				methods : ["GET"]
			},
			{
				name : "resetPassword",
				routes : ["/resetPassword"],
				methods : ["POST"]
			},
			{
				name : "restricted",
				routes : ["/restricted"],
				methods : ["GET", "POST"]
			}
		]
	}

	return userPolicy
};


module.exports = router;
