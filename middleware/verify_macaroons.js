
var MacaroonsBuilder        = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier       = require("macaroons.js").MacaroonsVerifier;
var TimestampCaveatVerifier = require('macaroons.js').verifier.TimestampCaveatVerifier;
const crypto                = require("crypto");

var serverSecretKey     = "af0c846e40abbc90cb8f270ea014e9a89ebf1b64d97403b656c6dfc8eeb47ed0";
var secretKey           = "3ec8441288c7220bbc5f9b8d144897b28615c4557e0ce5b179408bdd8c7c5779";
var caveatKey           = "secret2";
var caveatId            = "random2-32"
var location            = "http://www.endofgreatness.net";

var routesCaveatRegex   = /routes=(.*)/;

module.exports = function(options) {
    return function verifyMacaroons(req, res, next) {
        var serverId    = options.serverId;
        var userId      = req.cookies[serverId + "/userId"];
        var serializedMacaroon = req.cookies[serverId + "/" + req.method];

        validateRequest(serverId, userId, serializedMacaroon, req.method, req.path, req.db)
            .then(function(isValid){
                if(isValid){
                    next();
                }
                else{
                    res.sendStatus("401");
                }
            }, function(err){
                console.log(err);
                res.sendStatus("401");
            });
        };
};

function validateRequest(serverId, userId, serializedMacaroon, method, path, db){
    return new Promise((resolve, reject) => {
        if(typeof serializedMacaroon != "undefined"){
            var collection = db.collection('ACEs');
            collection.findOne({userId : userId})
                .then(function(user){
                    console.log("user found for request validation: " + user);
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
                                return true;
                            }
                        }
                        else{
                            return false;
                        }
                    });
 
                    if(verifier.isValid(secretKey)){
                        console.log("Provided Macaroon is valid");
                        return resolve(true);
                    }
                    else{
                        console.log("Provided Macaroon is invalid");
                        console.log(macaroon.inspect());
                        return resolve(false);
                    }
                });
        }
        else{
            console.log("No Macaroon provided for this request type");
            var error = new Error("No Macaroon provided for this request type");
            return reject(error);
        }
    });  
};
/*
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
/*

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

