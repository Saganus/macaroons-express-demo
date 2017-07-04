var express 	= require("express");
var router 		= express.Router();
var MongoClient = require('mongodb').MongoClient;
const crypto 	= require("crypto")
var cookie 		= require("cookie");


var scrypt 				= require("scrypt");
var scryptParameters 	= scrypt.paramsSync(0.1);

var MacaroonsBuilder 	= require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier 	= require("macaroons.js").MacaroonsVerifier;

var MacaroonAuthUtils	= require("../utils/macaroon_auth.js");

var location 	= "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey 			= "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";
var thirdPartySecret 	= "third-party secret";
var identifier 			= "random32";

var serverId 			= "restricted123"

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
	//console.log("user: " + user + ", pass: " +pass);
	if (typeof user !== 'undefined' && user !== '' 
		&& typeof pass !== 'undefined' && pass !== '' ){
		registerNewUser(user, pass, req.db, res);
	}
	else{
		res.status(400).send('Bad Request: User or password field undefined or empty');
	}

});

router.post("/login", function(req, res, next){

	var user = req.body.user;
	var key = req.body.pass;

	authenticate(user, key, req.db, res);

	/*
	if(authenticate(user, key, req.db, res)){
		
		// if user is valid, etc
		var userPolicy = getUserPolicy(user);
		console.log(userPolicy);
		//authMacaroons = MacaroonAuthUtils.generateMacaroons(location, secretKey, identifier);
		authMacaroons = MacaroonAuthUtils.generateMacaroons(userPolicy, location, secretKey, identifier);

		//console.log(authMacaroons);
		//console.log(authMacaroons["GET"]);
		//console.log(authMacaroons["POST"]);
		res.cookie(serverId+"/userId", user, { maxAge: defaultCookieAge, httpOnly: true });
		res.cookie(serverId+"/GET", authMacaroons["GET"], { maxAge: defaultCookieAge, httpOnly: true });
		res.cookie(serverId+"/POST", authMacaroons["POST"], { maxAge: defaultCookieAge, httpOnly: true });

		//res.render("generated_macaroon", { authMacaroons : authMacaroons});
		res.send("Successfully logged in");
		
	}
	else{
		res.sendStatus("401");
	}
	*/

	
});

/*
router.get("/logout", function(req, res, next){
	res.clearCookie(serverId+"/GET");
	res.clearCookie(serverId+"/POST");
	res.send("Logout successful");
});
*/


function registerNewUser(userId, pass, db, res){

	var kdfResult = scrypt.kdfSync(pass, scryptParameters);
	pass = kdfResult.toString("hex");
	var userPolicy = getUserPolicy(userId)
	inserUser(db, userId, pass, userPolicy, res);
};

function inserUser(db, userId, pass, userPolicy, res) {
  	// Get the ACEs collection
 	var collection = db.collection('ACEs');
  	// Insert  user
  	collection.find({userId : userId}).count(function(err, result){
  		if(result > 0){
  			res.status(403).send("Forbidden: Can\'t add user");
  		}
  		else{
  			//var secretKey = crypto.randomBytes(32).toString('hex');
	  		collection.insertOne({userId:userId, pass: pass, userPolicy: userPolicy}, function(err, result) {
	    		console.log("Registered a new user");
	    		res.status(200).send("OK: User registered");
	  		});	
  		}
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


function authenticate(userId, pass, db, res){
	var collection = db.collection('ACEs');
	collection.findOne({userId : userId}, function(err, user){
		var authenticated = scrypt.verifyKdfSync(Buffer.from(user.pass, "hex"), pass);	
		if(authenticated){
			var userPolicy = getUserPolicy(userId);
			console.log(userPolicy);
			//authMacaroons = MacaroonAuthUtils.generateMacaroons(location, secretKey, identifier);
			//console.log(user.secretKey)
			authMacaroons = MacaroonAuthUtils.generateMacaroons(userPolicy, location, secretKey, identifier);

			//console.log(authMacaroons);
			//console.log(authMacaroons["GET"]);
			//console.log(authMacaroons["POST"]);
			res.cookie(serverId+"/userId", userId, { maxAge: defaultCookieAge, httpOnly: true });
			res.cookie(serverId+"/GET", authMacaroons["GET"], { maxAge: defaultCookieAge, httpOnly: true });
			res.cookie(serverId+"/POST", authMacaroons["POST"], { maxAge: defaultCookieAge, httpOnly: true });
			res.cookie(serverId+"/PUT", authMacaroons["PUT"], { maxAge: defaultCookieAge, httpOnly: true });
			res.cookie(serverId+"/DELETE", authMacaroons["DELETE"], { maxAge: defaultCookieAge, httpOnly: true });

			//res.render("generated_macaroon", { authMacaroons : authMacaroons});
			res.send("Successfully logged in");
		}
		else{
			res.status("401").send("Unauthorized");
		}
	});
	
};


module.exports = router;
