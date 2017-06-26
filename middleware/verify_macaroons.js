
var MacaroonsBuilder = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier = require("macaroons.js").MacaroonsVerifier;

var caveatKey = "secret2";
var caveatId = "random2-32"
var location 	= "http://www.endofgreatness.net";

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
  	var userId		= req.cookies[options.serverId + "/userId"];

    getMacaroon 	= req.cookies[options.serverId + "/GET"]
    postMacaroon 	= req.cookies[options.serverId + "/POST"]


    var policy = getPolicy(userId);

    console.log("Verifying: " + req.method);
    if(req.method == "GET"){
	    if(typeof getMacaroon != "undefined"){
	    	macaroon = MacaroonsBuilder.deserialize(getMacaroon);
	    	console.log("GET Macaroon:");
	    	console.log(macaroon.inspect());
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact("server-id="+options.serverId);
	    	verifier.satisfyExact("http-verb=GET");

	    	var disjunctionDischarge = getDisjunctionDischarge(location, caveatKey, caveatId);
	    	console.log("disjunctionDischarge Macaroon:");
	    	console.log(disjunctionDischarge.inspect());

	    	var dp = MacaroonsBuilder.modify(macaroon).prepare_for_request(disjunctionDischarge).getMacaroon();
	    	console.log("GET Macaroon after prepare for request:");
	    	console.log(dp.inspect());

	    	verifier.satisfy3rdParty(dp);

			if(verifier.isValid(options.secretKey)){
				console.log("Provided Macaroon is valid");
	    		next();
	    	}
	    	else{
	    		console.log("Provided Macaroon is invalid");
	    		console.log(macaroon.inspect())
	    		res.sendStatus("401");
	    	}
	    }
	    else{
	    	console.log("No Macaroon provided for this request type");
	    	res.sendStatus("401");
		}
    }
    else if(req.method == "POST"){
    	if(typeof postMacaroon != "undefined"){
	    	macaroon = MacaroonsBuilder.deserialize(postMacaroon);
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact("server-id="+options.serverId);
	    	verifier.satisfyExact("http-verb=POST");

			if(verifier.isValid(options.secretKey)){
				console.log("Provided Macaroon is valid");
	    		next();
	    	}
	    	else{
	    		console.log("Provided Macaroon is invalid");
	    		console.log(macaroon.inspect())
	    		res.sendStatus("401");
	    	}
	    }
	    else{
	    	console.log("No Macaroon provided for this request type");
	    	res.sendStatus("401");
		}
    }
  };
};

function getDisjunctionDischarge(location, caveatKey, identifier){
	dischargeMacaroon = MacaroonsBuilder.create(location, caveatKey, identifier);
	dischargeMacaroon = MacaroonsBuilder.modify(dischargeMacaroon).getMacaroon();
	return dischargeMacaroon;
};


function getPolicy(userId){

};

