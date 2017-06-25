var MacaroonsBuilder 	= require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier 	= require("macaroons.js").MacaroonsVerifier;
var _ = require('lodash');

function getMacaroonScopes(userPolicy){

	var getScopes 		= getScopeRoutes(userPolicy.scopes, "GET");
	var postScopes 		= getScopeRoutes(userPolicy.scopes, "POST");
	var putScopes 		= getScopeRoutes(userPolicy.scopes, "PUT");
	var deleteScopes 	= getScopeRoutes(userPolicy.scopes, "DELETE");

	

	var macaroonScopes = {}
	macaroonScopes["GET"] 	= getScopes;
	macaroonScopes["POST"] 	= postScopes;
	macaroonScopes["PUT"] 	= putScopes;
	macaroonScopes["DELETE"] 	= deleteScopes;

	//console.log("macaroon scopes:");
	//console.log(macaroonScopes);

	return macaroonScopes;
};

function getScopeRoutes(scopes, method){
	return _.flatMap(scopes, function(scope) { 
		if (scope.methods.indexOf(method) > -1){
			return scope.routes
		}
		else{
			return [];
		}
	});
};

function generateMacaroons(userPolicy, location, secretKey, identifier){
	var macaroonScopes = getMacaroonScopes(userPolicy);

	var serverMacaroon 	= MacaroonsBuilder.create(location, secretKey, identifier);
	serverMacaroon 		= MacaroonsBuilder.modify(serverMacaroon).add_first_party_caveat("server-id="+userPolicy.serverId).getMacaroon();

	var authMacaroons = {};

	Object.keys(macaroonScopes).forEach(function(key, index){
		console.log(key)
		console.log(macaroonScopes[key])
		if (macaroonScopes[key].length > 0){
			authMacaroons[key] = generateRestrictedMacaroon(serverMacaroon, key, macaroonScopes[key]);
		}

	});
	//console.log("macaroons:");
	//console.log(authMacaroons);

	return authMacaroons;
};

function generateRestrictedMacaroon(serverMacaroon, method, scopes){
	restrictedMacaroon = addMethodToMacaroon(serverMacaroon, method);
	restrictedMacaroon = addScopesToMacaroon(restrictedMacaroon, scopes);

	return restrictedMacaroon.serialize();
}

function addScopesToMacaroon(macaroon, scopes){
	scopeCaveat = scopes.join(",")
	return MacaroonsBuilder.modify(macaroon).add_first_party_caveat("allowed-routes="+scopeCaveat).getMacaroon();
};

function addMethodToMacaroon(macaroon, method){
	return MacaroonsBuilder.modify(macaroon).add_first_party_caveat("http-verb="+method).getMacaroon();
};

/*
function generateMacaroons(location, secretKey, identifier){
	//console.log("Secret: ", secretKey.toString("hex"));

	var macaroon = MacaroonsBuilder.create(location, secretKey, identifier);
	macaroon = MacaroonsBuilder.modify(macaroon).add_first_party_caveat("server-id="+serverId).getMacaroon();
	

	var getMacaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat("http-verb=GET").getMacaroon();
	//getMacaroon 		= MacaroonsBuilder.modify(getMacaroon).add_first_party_caveat("allowed-routes=[/restricted]").getMacaroon();

    var postMacaroon 	= MacaroonsBuilder.modify(macaroon).add_first_party_caveat("http-verb=POST").getMacaroon();
    //postMacaroon 		= MacaroonsBuilder.modify(postMacaroon).add_first_party_caveat("allowed-routes=[/restricted]").getMacaroon();

	authMacaroons = {}
	authMacaroons["getMacaroon"] = getMacaroon.serialize();
	authMacaroons["postMacaroon"] = postMacaroon.serialize();

	return authMacaroons;
};
*/


module.exports = {
	generateMacaroons : generateMacaroons
};