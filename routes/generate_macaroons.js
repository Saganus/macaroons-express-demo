var express = require('express');
var router = express.Router();

const crypto = require('crypto')
var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;

var location = "http://www.endofgreatness.net";
var secretKey = crypto.randomBytes(32);
var identifier = "random32";

router.get('/', function(req, res, next){
	
	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);

	res.render('generated_macaroon', { macaroon : macaroon.serialize() })
});



 

