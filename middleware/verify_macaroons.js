
var MacaroonsBuilder        = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier       = require("macaroons.js").MacaroonsVerifier;
var TimestampCaveatVerifier = require('macaroons.js').verifier.TimestampCaveatVerifier;
const crypto                = require("crypto");

var macaroonServerSecret    = process.env.MACAROON_SERVER_SECRET;
var location                = "http://www.endofgreatness.net";
var routesCaveatRegex       = /routes=(.*)/;

//var caveatKey           = "secret2";
//var caveatId            = "random2-32"

module.exports = function(options) {
    return function verifyMacaroons(req, res, next) {
        var serverId            = options.serverId;
        var publicScope         = options.publicScope;
        var serializedMacaroon  = req.cookies[serverId + "/" + req.method];

        validateRequest(publicScope, serverId, serializedMacaroon, req.method, req.path, req.db)
            .then(function(isValid){
                if(isValid){
                    next();
                }
                else{
                    res.sendStatus("401");
                }
            }).catch(function (error) {
                console.log("Promise rejected:");
                console.log(error);
            });
    };
};

function validateRequest(publicScope, serverId, serializedMacaroon, method, path, db){
    return new Promise((resolve, reject) => {
        if(typeof publicScope !== "undefined" && typeof publicScope[method] !== "undefined" && publicScope[method].indexOf(path) > -1){
            return resolve(true);
        }
        else if(typeof serializedMacaroon !== "undefined"){
            macaroon = MacaroonsBuilder.deserialize(serializedMacaroon);

            var collection = db.collection('ACEs');
            collection.findOne({identifier : macaroon.identifier})
                .then(function(user){
                    var verifier = new MacaroonsVerifier(macaroon);

                    verifier.satisfyExact("server-id="+serverId);
                    verifier.satisfyExact("method="+method);
                    verifier.satisfyExact("route="+path);

                    verifier.satisfyGeneral(TimestampCaveatVerifier);
                    verifier.satisfyGeneral(function RouteCaveatVerifier(caveat) {
                        var match = routesCaveatRegex.exec(caveat);
                        if (match !== null) {
                            var parsedRoutes = match[1].split(",");
                            
                            if(parsedRoutes.indexOf(path) > -1){
                                return true;
                            }
                            else{
                                return false;
                            }
                        }
                        else{
                            return false;
                        }
                    });

                    const hash = crypto.createHash('sha256');
                    hash.update(macaroonServerSecret + user.macaroonSecret);
                    var macaroonSecretHash = hash.digest("hex");
                    var macaroonSecret = Buffer.from(macaroonSecretHash, "hex");

                    if(verifier.isValid(macaroonSecret)){
                        return resolve(true);
                    }
                    else{
                        console.log("Provided Macaroon is invalid");
                        console.log(macaroon.inspect());
                        return resolve(false);
                    }
                }).catch(function (error) {
                    console.log("Promise rejected:");
                    console.log(error);
                });
        }
        else{
            var error = new Error("No Macaroon provided for this request type");
            return reject(error);
        }
    });  
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

        if(verifier.isValid(macaroonSecret)){
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

