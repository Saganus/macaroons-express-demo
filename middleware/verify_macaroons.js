
var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier = require('macaroons.js').MacaroonsVerifier;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    // Implement the middleware function based on the options object
    console.log('Verifying macaroons');
    console.log(req.cookies);
    //console.log(req.cookies[options.server_id + '/GET']);

    req.macaroons = {}

    get_macaroon = req.cookies[options.server_id + '/GET']

    if(typeof get_macaroon != 'undefined'){
    	macaroon = MacaroonsBuilder.deserialize(get_macaroon);
    	var verifier = new MacaroonsVerifier(macaroon);
		if(verifier.isValid(options.secretKey)){
			console.log('Provided Macaroon is valid');
    		next();
    	}
    	else{
    		console.log('Provided Macaroon is invalid');
    		res.sendStatus('401');
    	}
    }
    else{
    	console.log('No Macaroon provided for this request type');
    	res.sendStatus('401');
	}
  }
}


