
var express = require("express");
var router = express.Router();

var macaroonsAuth = require("../middleware/verifyMacaroons");


/* GET home page. */

router.use(macaroonsAuth({serverId : "restricted123"}));

router.get("/", function(req, res, next){
	res.send("Succesfully accessed a restricted area");
});

module.exports = router;
