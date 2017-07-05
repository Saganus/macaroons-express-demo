
var MacaroonsBuilder        = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier       = require("macaroons.js").MacaroonsVerifier;
var TimestampCaveatVerifier = require('macaroons.js').verifier.TimestampCaveatVerifier;


var serverSecretKey     = "af0c846e40abbc90cb8f270ea014e9a89ebf1b64d97403b656c6dfc8eeb47ed0";
var secretKey           = "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";
var caveatKey           = "secret2";
var caveatId            = "random2-32"
var location            = "http://www.endofgreatness.net";

var routesCaveatRegex   = /routes=(.*)/;

module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    var serverId    = options.serverId;
    var userId      = req.cookies[serverId + "/userId"];
    var policy      = getPolicy(userId);

    var serializedMacaroon = req.cookies[serverId + "/" + req.method];

    if(isValidRequest(serverId, serializedMacaroon, req.method, req.path, req.db)){
        next();
    }
    else{
        res.sendStatus("401");    
    }
  };
};

function isValidRequest(serverId, serializedMacaroon, method, path, db){
    if(typeof serializedMacaroon != "undefined"){
        macaroon = MacaroonsBuilder.deserialize(serializedMacaroon);
        console.log(method + " Macaroon:");
        console.log(macaroon.inspect());
        var verifier = new MacaroonsVerifier(macaroon);
        verifier.satisfyExact("server-id="+serverId);
        verifier.satisfyExact("method="+method);
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

        if(verifier.isValid(secretKey)){
            console.log("Provided Macaroon is valid");
            return true;
        }
        else{
            console.log("Provided Macaroon is invalid");
            console.log(macaroon.inspect());
            return false;
        }
    }
    else{
        console.log("No Macaroon provided for this request type");
        return false;
    }
};

/*
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

function getDisjunctionDischarge(location, caveatKey, identifier, path){
    dischargeMacaroon = MacaroonsBuilder.create(location, caveatKey, identifier);
    dischargeMacaroon = MacaroonsBuilder.modify(dischargeMacaroon).add_first_party_caveat("route="+path) .getMacaroon();
    return dischargeMacaroon;
};
*/


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

