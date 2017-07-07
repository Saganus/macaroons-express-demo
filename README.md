# mAuth Middleware: Macaroons-based authentication middleware for Express

This is an experimental project to build an Express-based authorization middleware based on [Google Macaroons](https://research.google.com/pubs/pub41892.html) instead of regular cookies.

Right now the project contains two main parts: 
   * A very simple user authentication system to provide a testing framework for the actual macaroons auth middleware or *mAuth*
   * The actual *mAuth* middleware that provides verifies the requests to restricted API resources, and either allows or denies access to it.

The included authentication system is just the default set of API endpoints needed to provide a (very) simple login functionality that can show the *mAuth* system working (i.e. `POST /register` to create a new user, `POST /login` to login as an existing user, `POST /logout` to logout the user, etc)

The interesting parts are in the two core modules: the mint and the verifier (plus an optional, auxiliary method) that provide the actual proof-of-authorization Macaroons workflow:

   * After a user is registered and logs into the system, the *mAuth* mint module [creates four Macaroons](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L125-L127), one for each HTTP method (GET, POST, PUT and DELETE) based on the provided user policy
   * The generated Macaroons are [stored as four different cookies](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L68-L74) in their serialized forms (this is the suggested use, however it's not a requirement. The serialized Macaroons can be stored in pretty much any way)

On the other hand, to protect a restricted resource one needs only to 
   * [use the verifier middleware](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L33-L34) which after proper configuration will allow public scopes to be accessed without presenting a Macaroon 
   * or will [verify that the presented Macaroon authorizes the user](https://github.com/Saganus/macaroons-express-demo/blob/master/middleware/verify_macaroons.js#L50-L93) to access the restricted resource


   
   











