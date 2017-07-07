
var express = require("express");
var router = express.Router();

//var macaroonsAuth = require("../middleware/verify_macaroons");

//var serverId = process.env.SERVER_ID;

//router.use(macaroonsAuth({serverId : serverId}));

router.get("/", function(req, res, next){
    //res.send("Succesfully accessed a restricted area");
    res.render("logout_form", {});
});

module.exports = router;
