var express = require('express');
var router = express.Router();

const crypto = require('crypto')
var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier = require('macaroons.js').MacaroonsVerifier;

var location = "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey = "secret";
var identifier = "random32";

var cookie = require('cookie');

var default_cookie_age = 1;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/generate', function(req, res, next){
	
	console.log('Secret: ', secretKey.toString('hex'));

	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);

	res.cookie('server-123/GET', macaroon.serialize());
	res.cookie('server-123/POST', macaroon.serialize());
	//setMacaroonCookies(res, macaroon);
	res.render('generated_macaroon', { macaroon_serial : macaroon.serialize(),
										macaroon_info : macaroon.inspect()})
});

router.get('/verify/:macaroon', function(req, res, next){
	
	macaroon = MacaroonsBuilder.deserialize(req.params.macaroon);
	var verifier = new MacaroonsVerifier(macaroon);
	var valid = verifier.isValid(secretKey);

	res.render('verified_macaroon', { macaroon_serial : macaroon.serialize(),
										macaroon_info : macaroon.inspect(),
										valid : valid});
});

/*
var serializeCookie = function(key, value, hrs) {
	// This is res.cookie’s code without the array management and also ignores signed cookies.
 	if ('number' == typeof value) value = val.toString();
 	if ('object' == typeof value) value = JSON.stringify(val);

 	return cookie.serialize(key, value, { expires: new Date(Date.now() + 1000 * 60 * hrs), httpOnly: true });
};

var setMacaroonCookies = function(res, macaroon) {

	set_cookies = []
    set_cookies.push(serializeCookie('server-123/GET', macaroon.serialize(), default_cookie_age));
    set_cookies.push(serializeCookie('server-123/POST', macaroon.serialize(), default_cookie_age));
    res.header("Set-Cookie", set_cookies);
};*/

module.exports = router;
