var express         = require("express");
var path            = require("path");
var favicon         = require("serve-favicon");
var logger          = require("morgan");
var cookieParser    = require("cookie-parser");
var bodyParser      = require("body-parser");
var expressMongoDb  = require('express-mongo-db');

var index       = require("./routes/index");
var users       = require("./routes/users");
var restricted  = require("./routes/restricted");

var _ = require('lodash');

var mAuthVerifier       = require("mauth").mAuthVerifier;
var getVerifierParams   = require("./middleware/get_verifier_params");
var serverId            = process.env.SERVER_ID;
var location            = "http://www.endofgreatness.net";

var publicScope = {
    GET : ["/", "/login"],
    POST : ["/login", "/register", "/resetPassword"]
};

var app = express();

var routesCaveatVerifier = function(params){
    return function RoutesCaveatVerifier(caveat) {
        var routesCaveatRegex       = /routes=(.*)/;
        var match = routesCaveatRegex.exec(caveat);
        console.log(caveat);
        if (match !== null) {
            var parsedRoutes = match[1].split(",");

            var exactRoutes = parsedRoutes.filter(function(route) { 
                return route.indexOf("*") == -1;
            });

            var prefixRoutes = parsedRoutes.filter(function(route) { 
                return route.indexOf("*") > -1;
            });

            if(exactRoutes.indexOf(params.path) > -1){
                return true;
            }
            else{
                prefixRoutes.forEach(function(route){
                    if(params.path.startsWith(route)){
                        console.log("true prefix")
                        return true;
                    }
                });
                console.log("No match found in exact or prefix routes");
                return false;
            }
        }
        else{
            console.log("No match found");
            return false;
        }
    };
};

var satisfierFunctions = {
    "routes" : routesCaveatVerifier
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));
app.use(expressMongoDb('mongodb://localhost:27017/myproject'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(getVerifierParams({collection: "ACEs"}));
app.use(mAuthVerifier({publicScope : publicScope, satisfierFunctions: satisfierFunctions}));

app.use("/", index);
app.use("/users", users);
app.use("/restricted", restricted)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
