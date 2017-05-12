
var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier = require('macaroons.js').MacaroonsVerifier;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    get_macaroon 	= req.cookies[options.server_id + '/GET']
    post_macaroon 	= req.cookies[options.server_id + '/POST']

    console.log(req.method);
    if(req.method == 'GET'){
	    if(typeof get_macaroon != 'undefined'){
	    	macaroon = MacaroonsBuilder.deserialize(get_macaroon);
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact('server-id='+options.server_id);
	    	verifier.satisfyExact('http-verb=GET');


			if(verifier.isValid(options.secretKey)){
				console.log('Provided Macaroon is valid');
	    		next();
	    	}
	    	else{
	    		console.log('Provided Macaroon is invalid');
	    		console.log(macaroon.inspect())
	    		res.sendStatus('401');
	    	}
	    }
	    else{
	    	console.log('No Macaroon provided for this request type');
	    	res.sendStatus('401');
		}
    }
    else if(req.method == 'POST'){
    	if(typeof post_macaroon != 'undefined'){
	    	macaroon = MacaroonsBuilder.deserialize(post_macaroon);
	    	var verifier = new MacaroonsVerifier(macaroon);
	    	verifier.satisfyExact('server-id='+options.server_id);
	    	verifier.satisfyExact('http-verb=POST');

			if(verifier.isValid(options.secretKey)){
				console.log('Provided Macaroon is valid');
	    		next();
	    	}
	    	else{
	    		console.log('Provided Macaroon is invalid');
	    		console.log(macaroon.inspect())
	    		res.sendStatus('401');
	    	}
	    }
	    else{
	    	console.log('No Macaroon provided for this request type');
	    	res.sendStatus('401');
		}
    }


  }
}


