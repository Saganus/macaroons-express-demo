var express = require("express");
var router 	= express.Router();

//const crypto = require("crypto")
var cookie 	= require("cookie");

var scrypt = require("scrypt");
var scryptParameters = scrypt.paramsSync(0.1);

var MacaroonsBuilder 	= require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier 	= require("macaroons.js").MacaroonsVerifier;

var location 	= "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey 			= "secret";
var thirdPartySecret 	= "third-party secret";
var identifier 			= "random32";

var serverId 			= "restricted123"

var defaultCookieAge = 1 * 60 * 60 * 1000;

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
	var key = req.body.pass;

	registerNewUser(user, key);

	res.send("New user registered successfully");
});

router.post("/login", function(req, res, next){

	var user = req.body.user;
	var key = req.body.pass;

	if(authenticate(user, key)){
		// if user is valid, etc
		authMacaroons = generate_macaroons();
		//console.log(authMacaroons);
		console.log(authMacaroons["getMacaroon"]);
		console.log(authMacaroons["postMacaroon"]);
		res.cookie(serverId+"/GET", authMacaroons["getMacaroon"], { maxAge: defaultCookieAge, httpOnly: true });
		res.cookie(serverId+"/POST", authMacaroons["postMacaroon"], { maxAge: defaultCookieAge, httpOnly: true });

		res.render("generated_macaroon", { authMacaroons : authMacaroons});
	}
	else{
		res.sendStatus("401");
	}

	
});

router.get("/logout", function(req, res, next){
	res.clearCookie(serverId+"/GET");
	res.clearCookie(serverId+"/POST");
	res.send("Logout successful");
});


router.get("/verify/:macaroon", function(req, res, next){
	
	macaroon = MacaroonsBuilder.deserialize(req.params.macaroon);
	var verifier = new MacaroonsVerifier(macaroon);
	var valid = verifier.isValid(secretKey);

	res.render("verified_macaroon", { macaroon_serial : macaroon.serialize(),
										macaroon_info : macaroon.inspect(),
										valid : valid});
});

function generate_macaroons(){
	//console.log("Secret: ", secretKey.toString("hex"));

	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);
	macaroon = MacaroonsBuilder.modify(macaroon).add_first_party_caveat("server-id="+serverId).getMacaroon();

	var getMacaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat("http-verb=GET").getMacaroon();
	//getMacaroon 		= MacaroonsBuilder.modify(getMacaroon).add_first_party_caveat("allowed-routes=[/restricted]").getMacaroon();

    var postMacaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat("http-verb=POST").getMacaroon();
    //postMacaroon 		= MacaroonsBuilder.modify(postMacaroon).add_first_party_caveat("allowed-routes=[/restricted]").getMacaroon();

	authMacaroons = {}
	authMacaroons["getMacaroon"] = getMacaroon.serialize();
	authMacaroons["postMacaroon"] = postMacaroon.serialize();

	return authMacaroons;
}

function registerNewUser(user, key){
	var kdfResult = scrypt.kdfSync("pass", scryptParameters);
	defaultPass = kdfResult.toString("hex");
	console.log("New user registered: " + defaultPass);
}

function authenticate(user, key){

	return scrypt.verifyKdfSync(Buffer.from(defaultPass, "hex"), "pass");
}

module.exports = router;
