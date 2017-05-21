
var MacaroonsBuilder = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier = require("macaroons.js").MacaroonsVerifier;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    getMacaroon 	= req.cookies[options.server_id + "/GET"]
    postMacaroon 	= req.cookies[options.server_id + "/POST"]

    console.log(req.method);
    if(req.method == "GET"){
	    if(typeof getMacaroon != "undefined"){
	    	macaroon = MacaroonsBuilder.deserialize(getMacaroon);
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact("server-id="+options.server_id);
	    	verifier.satisfyExact("http-verb=GET");


			if(verifier.isValid(options.secret_key)){
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
	    	verifier.satisfyExact("server-id="+options.server_id);
	    	verifier.satisfyExact("http-verb=POST");

			if(verifier.isValid(options.secret_key)){
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


  }
}


