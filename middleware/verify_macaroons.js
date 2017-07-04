
var MacaroonsBuilder        = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier       = require("macaroons.js").MacaroonsVerifier;
var TimestampCaveatVerifier = require('macaroons.js').verifier.TimestampCaveatVerifier;


var secretKey           = "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";
var caveatKey           = "secret2";
var caveatId            = "random2-32"
var location            = "http://www.endofgreatness.net";

var routesCaveatRegex   = /routes=(.*)/;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    var serverId    = options.serverId;
    var userId      = req.cookies[serverId + "/userId"];

    getMacaroon     = req.cookies[serverId + "/GET"]
    postMacaroon    = req.cookies[serverId + "/POST"]
    putMacaroon     = req.cookies[serverId + "/PUT"]
    deleteMacaroon  = req.cookies[serverId + "/DELETE"]

    var policy = getPolicy(userId);

    console.log("Verifying: " + req.method);
    if(req.method == "GET"){
        if(isValidGetRequest(serverId, getMacaroon, req.path)){
            next();
        }
        else{
            res.sendStatus("401");
        }
    }
    else if(req.method == "POST"){
        if(isValidPostRequest(serverId, postMacaroon, req.path)){
            next();
        }
        else{
            res.sendStatus("401");
        }
    }
    else if(req.method == "PUT"){
        if(isValidPutRequest(serverId, putMacaroon, req.path)){
            next();
        }
        else{
            res.sendStatus("401");
        }
    }
    else if(req.method == "DELETE"){
        if(isValidDeleteRequest(serverId, deleteMacaroon, req.path)){
            next();
        }
        else{
            res.sendStatus("401");
        }
    }
    else{
        res.sendStatus("401");
    }
  };
};

function isValidGetRequest(serverId, getMacaroon, path){
    if(typeof getMacaroon != "undefined"){
        macaroon = MacaroonsBuilder.deserialize(getMacaroon);
        console.log("GET Macaroon:");
        console.log(macaroon.inspect());
        var verifier = new MacaroonsVerifier(macaroon);
        verifier.satisfyExact("server-id="+serverId);
        verifier.satisfyExact("method=GET");
        verifier.satisfyExact("route="+path);
        verifier.satisfyGeneral(TimestampCaveatVerifier);
        verifier.satisfyGeneral(function RouteCaveatVerifier(caveat) {
            var match = routesCaveatRegex.exec(caveat);
            if (match !== null) {
                var parsedRoutes = match[1].split(",");
                console.log("Allowed routes: ");
                console.log(parsedRoutes);
                if(parsedRoutes.indexOf(path) > -1){
                    return true
                }
            }
            else{
                return false;
            }
        });
        //var disjunctionDischarge = getDisjunctionDischarge(location, caveatKey, caveatId, req.path);
        //console.log("disjunctionDischarge Macaroon:");
        //console.log(disjunctionDischarge.inspect());

        //var dp = MacaroonsBuilder.modify(macaroon).prepare_for_request(disjunctionDischarge).getMacaroon();
        //console.log("GET Macaroon after prepare for request:");
        //console.log(dp.serialize());

        //verifier.satisfy3rdParty(dp);

        if(verifier.isValid(secretKey)){
            console.log("Provided Macaroon is valid");
            return true;
        }
        else{
            console.log("Provided Macaroon is invalid");
            console.log(macaroon.inspect())
            return false;
        }
    }
    else{
        console.log("No Macaroon provided for this request type");
        return false;
    }
};

function isValidPostRequest(serverId, postMacaroon, path){
    if(typeof postMacaroon != "undefined"){
        macaroon = MacaroonsBuilder.deserialize(postMacaroon);
        var verifier = new MacaroonsVerifier(macaroon);
        verifier.satisfyExact("server-id="+serverId);
        verifier.satisfyExact("method=POST");

        if(verifier.isValid(secretKey)){
            console.log("Provided Macaroon is valid");
            return true
        }
        else{
            console.log("Provided Macaroon is invalid");
            console.log(macaroon.inspect())
            return false;
        }
    }
    else{
        console.log("No Macaroon provided for this request type");
        return false;
    }
};

function isValidPutRequest(serverId, putMacaroon, path){

};

function isValidDeleteRequest(serverId, deleteMacaroon, path){

};

function getDisjunctionDischarge(location, caveatKey, identifier, path){
    dischargeMacaroon = MacaroonsBuilder.create(location, caveatKey, identifier);
    dischargeMacaroon = MacaroonsBuilder.modify(dischargeMacaroon).add_first_party_caveat("route="+path) .getMacaroon();
    return dischargeMacaroon;
};


function getPolicy(userId){
    var userPolicy = {
        name : "memberAccess",
        description: "Access policy for members of the site",
        serverId : "restricted123",
        expires : 60*60*24,
        scopes : [
            {
                name : "public",
                routes : ["/", "/login"],
                methods : ["GET"]
            },
            {
                name : "resetPassword",
                routes : ["/resetPassword"],
                methods : ["POST"]
            },
            {
                name : "restricted",
                routes : ["/restricted"],
                methods : ["GET", "POST"]
            }
        ]
    }

    return userPolicy
};

