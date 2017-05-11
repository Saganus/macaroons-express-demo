
var express = require('express');
var router = express.Router();

var MacaroonsVerifier = require('macaroons.js').MacaroonsVerifier;
var macaroons_auth = require('../middleware/verify_macaroons');

var location = "http://www.endofgreatness.net";
//var secretKey = crypto.randomBytes(32);
var secretKey = "secret";
var identifier = "random32";

/* GET home page. */

router.use(macaroons_auth({server_id : 'server-123', secretKey: secretKey}));

router.get('/', function(req, res, next){
	//macaroon = MacaroonsBuilder.deserialize(req.macaroons);
	macaroon = req.macaroons;
	//ar verifier = new MacaroonsVerifier(macaroon);
	//var valid = verifier.isValid(secretKey);

	res.send('test')
	//res.render('restricted_area', { macaroon_serial : macaroon.serialize(),
	//									macaroon_info : macaroon.inspect(),
	//									valid : valid});
});

module.exports = router;
