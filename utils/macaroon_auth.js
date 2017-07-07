var MacaroonsBuilder    = require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier   = require("macaroons.js").MacaroonsVerifier;

var _ = require('lodash');

//var caveatKey         = "secret2";
//var caveatId          = "random2-32"

// in minutes from now
var defaultExpiration   = 5; 

function generateMacaroons(userPolicy, location, macaroonSecret, identifier){
    var macaroonScopes  = getMacaroonScopes(userPolicy);

    var serverMacaroon  = MacaroonsBuilder.create(location, macaroonSecret, identifier);
    serverMacaroon      = MacaroonsBuilder.modify(serverMacaroon).add_first_party_caveat("server-id="+userPolicy.serverId).getMacaroon();

    var authMacaroons   = {};

    Object.keys(macaroonScopes).forEach(function(key, index){
        if (macaroonScopes[key].length > 0){
            authMacaroons[key] = generateRestrictedMacaroon(serverMacaroon, key, macaroonScopes[key], location);
        }

    });

    return authMacaroons;
};

function getMacaroonScopes(userPolicy){

    var getScopes       = getScopeRoutes(userPolicy.scopes, "GET");
    var postScopes      = getScopeRoutes(userPolicy.scopes, "POST");
    var putScopes       = getScopeRoutes(userPolicy.scopes, "PUT");
    var deleteScopes    = getScopeRoutes(userPolicy.scopes, "DELETE");

    var macaroonScopes          = {};
    macaroonScopes["GET"]       = getScopes;
    macaroonScopes["POST"]      = postScopes;
    macaroonScopes["PUT"]       = putScopes;
    macaroonScopes["DELETE"]    = deleteScopes;

    return macaroonScopes;
};

function getScopeRoutes(scopes, method){
    return _.flatMap(scopes, function(scope) { 
        if (scope.methods.indexOf(method) > -1){
            return scope.routes;        }
        else{
            return [];
        }
    });
};


function generateRestrictedMacaroon(serverMacaroon, method, scopes, location){
    restrictedMacaroon = addMethodToMacaroon(serverMacaroon, method);
    restrictedMacaroon = addScopesToMacaroon(restrictedMacaroon, scopes);
    restrictedMacaroon = addTimeExpirationToMacaroon(restrictedMacaroon, defaultExpiration);
    //restrictedMacaroon = addDisjunctionCaveat(restrictedMacaroon, location, caveatKey, caveatId);
    return restrictedMacaroon.serialize();
}

function addDisjunctionCaveat(macaroon, location, caveatKey, identifier){
    return MacaroonsBuilder.modify(macaroon)
        .add_third_party_caveat(location, caveatKey, identifier)
        .getMacaroon();
};

function addScopesToMacaroon(macaroon, scopes){
    scopeCaveat = scopes.join(",");
    
    return MacaroonsBuilder.modify(macaroon)
        .add_first_party_caveat("routes="+scopeCaveat)
        .getMacaroon();
};

function addMethodToMacaroon(macaroon, method){
    return MacaroonsBuilder.modify(macaroon)
        .add_first_party_caveat("method="+method)
        .getMacaroon();
};

function addTimeExpirationToMacaroon(macaroon, minutesFromNow){
    var expiration  = new Date();
    expiration      = new Date(expiration.getTime() + (minutesFromNow * 60 * 1000));

    return MacaroonsBuilder.modify(macaroon)
        .add_first_party_caveat("time < "+ expiration.toJSON().toString())
        .getMacaroon();
};  


module.exports = {
    generateMacaroons : generateMacaroons
};