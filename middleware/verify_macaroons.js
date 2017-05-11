
module.exports = function(options) {
  return function verify_macaroons(req, res, next) {
    // Implement the middleware function based on the options object
    console.log('Verifying macaroons');
    console.log(req.cookies);
    req.macaroons = {}
    req.macaroons.get = "asas"
    next();
  }
}


