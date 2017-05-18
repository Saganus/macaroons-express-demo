
var express = require('express');
var router = express.Router();

var macaroons_auth = require('../middleware/verify_macaroons');


/* GET home page. */

router.use(macaroons_auth({server_id : 'restricted123', secret_key: 'secret'}));

router.get('/', function(req, res, next){
	res.send('Succesfully accessed a restricted area');
});

module.exports = router;
