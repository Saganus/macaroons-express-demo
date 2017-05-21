var express = require('express');
var router 	= express.Router();

//const crypto = require('crypto')
var cookie 	= require('cookie');

var scrypt = require("scrypt");
var scryptParameters = scrypt.paramsSync(0.1);

var MacaroonsBuilder 	= require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier 	= require('macaroons.js').MacaroonsVerifier;

var location 	= "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secret_key 			= "secret";
var third_party_secret 	= "third-party secret"
var identifier 			= "random32";

var server_id 			= "restricted123"

var default_cookie_age = 1 * 60 * 60 * 1000;

var defaultPass = 'pass';

/* GET home page. */
router.get('/', function(req, res, next) {
 	res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next){
	res.render('login_form', {});
});

router.post('/register', function(req, res, next){

	var user = req.body.user;
	var key = req.body.pass;

	registerNewUser(user, key);

	res.send('New user registered successfully');
});

router.post('/login', function(req, res, next){

	var user = req.body.user;
	var key = req.body.pass;

	if(authenticate(user, key)){
		// if user is valid, etc
		auth_macaroons = generate_macaroons();
		//console.log(auth_macaroons);
		console.log(auth_macaroons['get_macaroon']);
		console.log(auth_macaroons['post_macaroon']);
		res.cookie(server_id+'/GET', auth_macaroons['get_macaroon'], { maxAge: default_cookie_age, httpOnly: true });
		res.cookie(server_id+'/POST', auth_macaroons['post_macaroon'], { maxAge: default_cookie_age, httpOnly: true });

		res.render('generated_macaroon', { auth_macaroons : auth_macaroons});
	}
	else{
		res.sendStatus('401');
	}

	
});

router.get('/logout', function(req, res, next){
	res.clearCookie(server_id+'/GET');
	res.clearCookie(server_id+'/POST');
	res.send('Logout successful');
});


router.get('/verify/:macaroon', function(req, res, next){
	
	macaroon = MacaroonsBuilder.deserialize(req.params.macaroon);
	var verifier = new MacaroonsVerifier(macaroon);
	var valid = verifier.isValid(secret_key);

	res.render('verified_macaroon', { macaroon_serial : macaroon.serialize(),
										macaroon_info : macaroon.inspect(),
										valid : valid});
});

function generate_macaroons(){
	//console.log('Secret: ', secret_key.toString('hex'));

	var macaroon = MacaroonsBuilder.create(location, secret_key, identifier);
	macaroon = MacaroonsBuilder.modify(macaroon).add_first_party_caveat('server-id='+server_id).getMacaroon();

	var get_macaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat('http-verb=GET').getMacaroon();
	//get_macaroon 		= MacaroonsBuilder.modify(get_macaroon).add_first_party_caveat('allowed-routes=[/restricted]').getMacaroon();

    var post_macaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat('http-verb=POST').getMacaroon();
    //post_macaroon 		= MacaroonsBuilder.modify(post_macaroon).add_first_party_caveat('allowed-routes=[/restricted]').getMacaroon();

	auth_macaroons = {}
	auth_macaroons['get_macaroon'] = get_macaroon.serialize();
	auth_macaroons['post_macaroon'] = post_macaroon.serialize();

	return auth_macaroons;
}

function registerNewUser(user, key){
	var kdfResult = scrypt.kdfSync('pass', scryptParameters);
	defaultPass = kdfResult.toString('hex');
	console.log('New user registered: ' + defaultPass);
}

function authenticate(user, key){

	return scrypt.verifyKdfSync(Buffer.from(defaultPass, 'hex'), 'pass');
}

module.exports = router;
