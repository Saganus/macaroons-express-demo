var express = require('express');
var router 	= express.Router();

//const crypto = require('crypto')
var cookie 	= require('cookie');

var MacaroonsBuilder 	= require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier 	= require('macaroons.js').MacaroonsVerifier;

var location 	= "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey 	= "secret";
var identifier 	= "random32";


var default_cookie_age = 1 * 60 * 60 * 1000;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/generate', function(req, res, next){
	
	console.log('Secret: ', secretKey.toString('hex'));

	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);
	macaroon = MacaroonsBuilder.modify(macaroon).add_first_party_caveat('server-id=server-123').getMacaroon();

	var get_macaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat('http-verb=GET').getMacaroon();
	get_macaroon 		= MacaroonsBuilder.modify(get_macaroon).add_first_party_caveat('allowed-routes=[/restricted]').getMacaroon();

    var post_macaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat('http-verb=POST').getMacaroon();
    post_macaroon 		= MacaroonsBuilder.modify(post_macaroon).add_first_party_caveat('allowed-routes=[/restricted]').getMacaroon();

	res.cookie('server-123/GET', get_macaroon.serialize(), { maxAge: default_cookie_age, httpOnly: true });
	res.cookie('server-123/POST', post_macaroon.serialize(), { maxAge: default_cookie_age, httpOnly: true });
	//setMacaroonCookies(res, macaroon);
	auth_macaroons = []
	auth_macaroons.push(get_macaroon.inspect());
	auth_macaroons.push(post_macaroon.inspect());
	res.render('generated_macaroon', { auth_macaroons : auth_macaroons})
});

router.get('/verify/:macaroon', function(req, res, next){
	
	macaroon = MacaroonsBuilder.deserialize(req.params.macaroon);
	var verifier = new MacaroonsVerifier(macaroon);
	var valid = verifier.isValid(secretKey);

	res.render('verified_macaroon', { macaroon_serial : macaroon.serialize(),
										macaroon_info : macaroon.inspect(),
										valid : valid});
});


module.exports = router;
