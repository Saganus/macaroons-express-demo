# macaroons-express-demo

This is an experimental project to build an Express-based authorization middleware based on [Google Macaroons](https://research.google.com/pubs/pub41892.html) instead of regular cookies.

Right now the project contains two main parts: 
   * A very simple user authentication system to provide a testing framework for the actual macaroons auth middleware or *mAuth*
   * The actual *mAuth* middleware that provides verifies the requests to restricted API resources, and either allows or denies access to it.

The included authentication system is just the default set of API endpoints needed to provide a (very) simple login functionality that can show the *mAuth* system working.


