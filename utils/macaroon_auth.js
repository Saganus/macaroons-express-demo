var MacaroonsBuilder 	= require("macaroons.js").MacaroonsBuilder;
var MacaroonsVerifier 	= require("macaroons.js").MacaroonsVerifier;

var serverId = "restricted123";

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
}


module.exports = {
	generateMacaroons : generateMacaroons
};