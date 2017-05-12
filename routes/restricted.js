
var express = require('express');
var router = express.Router();

var macaroons_auth = require('../middleware/verify_macaroons');


/* GET home page. */

router.use(macaroons_auth({server_id : 'server-123', secretKey: 'secret'}));

router.get('/', function(req, res, next){
	res.send('This is a restricted area');
});

module.exports = router;
