
var express = require("express");
var router = express.Router();

var macaroonsAuth = require("../middleware/verify_macaroons");


/* GET home page. */

router.use(macaroonsAuth({server_id : "restricted123", secret_key: "secret"}));

router.get("/", function(req, res, next){
	res.send("Succesfully accessed a restricted area");
});

module.exports = router;
