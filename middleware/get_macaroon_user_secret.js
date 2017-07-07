var mAuthMint   = require("mauth").mAuthMint;

module.exports = function(options) {
    return function getMacaroonUserSecret(req, res, next) {
        if(typeof options.collection !== "undefined" && options.collection !== ""){
            var userId = "";
            if(req.method == "GET" || req.method == "DELETE"){
                userId = req.query.userId;
            }
            else{
                userId = req.body.userId;
            }

            if(typeof userId !== "undefined" && userId !== ""){
                var collection = req.db.collection(options.collection);
                collection.findOne({userId: userId})
                    .then(function(user){
                        if(user !== null){
                            console.log("Setting macaroonUserSecret for user: " + user.userId);
                            var macaroonSecret = mAuthMint.calculateMacaroonSecret(user.macaroonSecret);
                            req.macaroonSecret = macaroonSecret;
                        }
                        else{
                            console.log("Setting macaroonUserSecret to null for user");
                            req.macaroonUserSecret = null;
                        }
                        next();
                    }).catch(function (error) {
                        console.log("Promise rejected:");
                        console.log(error);
                        res.sendStatus("401");
                    }); 
            }
            else{
                console.log("userId not found. Setting macaroonUserSecret to null: " + userId);
                req.macaroonUserSecret = null;
                next();
            }
        }
        else{
            var error = new Error("Error configuring getMacaroonUserSecret")
            console.log(error);
            res.sendStatus("401");
        }
    };
};