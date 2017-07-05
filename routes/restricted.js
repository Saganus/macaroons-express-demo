
var express = require("express");
var router = express.Router();

var macaroonsAuth = require("../middleware/verify_macaroons");

var serverId = process.env.SERVER_ID;

/* GET home page. */

router.use(macaroonsAuth({serverId : serverId}));

router.get("/", function(req, res, next){
	res.send("Succesfully accessed a restricted area");
});

module.exports = router;
