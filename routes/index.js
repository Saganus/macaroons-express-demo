var express = require('express');
var router = express.Router();

const crypto = require('crypto')
var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;
var MacaroonsVerifier = require('macaroons.js').MacaroonsVerifier;

var location = "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey = "secret";
var identifier = "random32";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/generate', function(req, res, next){
	
	console.log('Secret: ', secretKey.toString('hex'));

	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);
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

module.exports = router;
