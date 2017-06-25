
var MacaroonsBuilder = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier = require("macaroons.js").MacaroonsVerifier;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
  	var userId		= req.cookies[options.serverId + "/userId"];

    getMacaroon 	= req.cookies[options.serverId + "/GET"]
    postMacaroon 	= req.cookies[options.serverId + "/POST"]


    var policy = getPolicy(userId);

    console.log(req.method);
    if(req.method == "GET"){
	    if(typeof getMacaroon != "undefined"){
	    	macaroon = MacaroonsBuilder.deserialize(getMacaroon);
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact("server-id="+options.serverId);
	    	verifier.satisfyExact("http-verb=GET");
	    	verifier.satisfyGeneral(RouteCaveatVerifier);

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

var CAVEAT_PREFIX = /allowed-routes=(.*)*/;
function RouteCaveatVerifier(caveat) {
    if (CAVEAT_PREFIX.test(caveat)) {
    	return true;
    }
    return false;
};

function getPolicy(userId){

};

