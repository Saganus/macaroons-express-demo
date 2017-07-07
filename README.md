# mAuth: Macaroons-based authentication middleware for Express

## What is mAuth?

This is an experimental project to build an Express-based authorization middleware based on [Google Macaroons](https://research.google.com/pubs/pub41892.html) instead of regular cookies.

Right now the project contains two main parts: 
   * A very simple user authentication system to provide a testing framework for the actual macaroons auth middleware or *mAuth*
   * The actual *mAuth* middleware that provides verifies the requests to restricted API resources, and either allows or denies access to it.

The included authentication system is just the default set of API endpoints needed to provide a (very) simple login functionality that can show the *mAuth* system working (i.e. `POST /register` to create a new user, `POST /login` to login as an existing user, `POST /logout` to logout the user, etc)

The interesting parts are in the two core modules: the mint and the verifier (plus an optional, auxiliary method) that provide the actual proof-of-authorization Macaroons workflow.

## How does mAuth work?

The proposed workflow for this first approach is the following:

   * After a user is registered and logs into the system, the *mAuth* mint module [creates four Macaroons](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L125-L127), one for each HTTP method (GET, POST, PUT and DELETE) based on the provided user policy
   * The generated Macaroons are [stored as four different cookies](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L68-L74) in their serialized forms (this is the suggested use, however it's not a requirement. The serialized Macaroons can be stored in pretty much any way)

On the other hand, to protect a restricted resource one needs only to 
   * [use the verifier middleware](https://github.com/Saganus/macaroons-express-demo/blob/master/routes/index.js#L34) which after proper configuration will allow public scopes to be accessed without presenting a Macaroon 
   * or will [verify that the presented Macaroon authorizes the user](https://github.com/Saganus/macaroons-express-demo/blob/master/middleware/verify_macaroons.js#L50-L93) to access the restricted resource
   
The way the Macaroons are used to restrict access is basically by using first-party caveats only (although I have plans to use a more sophisticated Macaroon construction including a "local login" third-party caveat structure suggested by Robert Escriva) and then verifying that those caveats hold at the time of access. 

Each access Macaroon consists of [the following first-party caveats](https://github.com/Saganus/macaroons-express-demo/blob/master/middleware/verify_macaroons.js#L58-L63):

   * `serverId=<the serverId specified in the env var>`
   * `method=<the HTTP method used for the request>`
   * `route=<the requested API path>`
   * `time < <"now" + X minutes>` (the Macaroon expiry time)

All these caveats must hold at the time of the request for it to be valid and thus allowed to be processed. This provides intersesting functionality, like the ability to invalidate *all* Macaroons by just changing the serverId. Also, due to having a Macaroon for each method we can better define user policies and isolate dangerous functionality (DELETE, PUT) and make it harder for an attacker to cause damage in case Macaroons are stolen. 

## Advantages

The idea is to provide a very simple to use middleware with per-instance and per-verb granularity in the access rules, while at the same time providing enhanced protection compared to a cookie-based approach. Since the access Macaroons are cryptographycally signed and include the context in which they are valid, it's much harder to do unauthorized actions in case of Macaroon theft. 

In contrast, in a traditional cookie-based system it's an all-or-nothing approach. I.e. an auth token stored in a cookie either grants complete access in case it's stolen, and only by revoking the cookie can access be prevented.

With the *mAuth* system, if for example the most commonly used Macaroon is the GET Macaroon and it happens to be stolen by a MITM, the attacker won't be able to do anything else other than GET requests while the Macaroon is valid, and only to those restricted routes specified in the user policy.

## How to use the mAuth middleware?

To use the system you need a MongoDB instance. Ideally I will later add support for other DBs but for now this is the easiest one to work with for a simple demo. 

   * Clone the repo: `git clone https://github.com/Saganus/macaroons-express-demo.git`
   
   * [Set the DB connection info](https://github.com/Saganus/macaroons-express-demo/blob/master/app.js#L22)
   
   * Set the env vars MACAROON_SERVER_SECRET (ideally 32 random bytes e.g. `crypto.randomBytes(32).toString('hex');`) and SERVER_ID (whatever you like to use to identify your server) and then start it, e.g.:
   
   `MACAROON_SERVER_SECRET=af0c846e40abbc90cb8f270ea014e9a89ebf1b64d97403b656c6dfc8eeb47ed0 SERVER_ID=restricted123 npm start`
   
   * Open a browser and navigate to the server root http://localhost:3000 and a login/register screen should appear.
   
   * Register a new user with whatever name and password you like
   
   * Navigate back to the root/login page and login. If the password is correct 4 Macaroons will be set as cookies and you will be redirected to http://localhost:3000/restricted?userId=<your user>
   
   * If you try to access the restricted page with any other userId you will be prevented from doing so
   
   * If you navigate to http://localhost:3000/logout a new random 32-byte secret will be generated and saved for your user such that immediately after that all Macaroons signed with that secret will be invalid, thus effectively logging you out immediately.
   
  

   
   











