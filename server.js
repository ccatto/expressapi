var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contact";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

var cattoMONGODB_URI = "mongodb://ccatto:s!mple@ds147789.mlab.com:47789/cattomlabfun";

// mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
mongodb.MongoClient.connect(cattoMONGODB_URI, function (err, database) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW
Sign Up
Learn Angular   Angular Tutorials  Deploy Your Own REST API in 30 Mins Using mLab and Heroku
Deploy Your Own REST API in 30 Mins Using mLab and Heroku
April 07, 2016, By Chris Chang
Related Topics:
npm
Ajax
React
APIs
Tools & Libraries
More...

This article was first published on the Heroku Dev Center

The MEAN stack is a popular web development stack made up of MongoDB, Express, AngularJS, and Node.js. MEAN has gained popularity because it allows developers to program in JavaScript on both the client and the server. The MEAN stack enables a perfect harmony of JavaScript Object Notation (JSON) development: MongoDB stores data in a JSON-like format, Express and Node.js facilitate easy JSON query creation, and AngularJS allows the client to seamlessly send and receive JSON documents.

MEAN is generally used to create browser-based web applications because AngularJS (client-side) and Express (server-side) are both frameworks for web apps. Another compelling use case for MEAN is the development of RESTful API servers. Creating RESTful API servers has become an increasingly important and common development task, as applications increasingly need to gracefully support a variety of end-user devices, such as mobile phones and tablets. This tutorial will demonstrate how to use the MEAN stack to rapidly create a RESTful API server.

AngularJS, a client-side framework, is not a necessary component for creating an API server. You could also write an Android or iOS application that runs on top of the REST API. We include AngularJS in this tutorial to demonstrate how it allows us to quickly create a web application that runs on top of the API server.

The application we will develop in this tutorial is a basic contact management application that supports standard CRUD (Create, Read, Update, Delete) operations. First, we’ll create a RESTful API server to act as an interface for querying and persisting data in a MongoDB database. Then, we’ll leverage the API server to build an Angular-based web application that provides an interface for end users. Finally, we will deploy our app to Heroku.

So that we can focus on illustrating the fundamental structure of a MEAN application, we will deliberately omit common functionality such as authentication, access control, and robust data validation.

Prerequisites
To deploy the app to Heroku, you’ll need a Heroku account. If you have never deployed a Node.js application to Heroku before, we recommend going through the Getting Started with Node.js on Heroku tutorial before you begin.

Also, ensure that you have the following installed on your local machine:

Heroku toolbelt
Node.js
Source Code Structure
The source code for this project is available on GitHub at https://github.com/sitepoint-editors/mean-contactlist. The repository contains:

package.json — a configuration file that contains metadata about your application. When this file is present in the root directory of a project, Heroku will use the Node.js buildpack.
app.json — a manifest format for describing web apps. It declares environment variables, add-ons, and other information required to run an app on Heroku. It is required to create a “Deploy to Heroku” button.
server.js — this file contains all of our server-side code, which implements our REST API. It’s written in Node.js, using the Express framework and the MongoDB Node.js driver.
/public directory — this directory contains all of the client-side files which includes the AngularJS code.
See the Sample Application Running
To see a running version of the application this tutorial will create, you can view our running example here: https://sleepy-citadel-45065.herokuapp.com/

Now, let’s follow the tutorial step by step.

Create a New App
Create a new directory for your app and use the cd command to navigate to that directory. From this directory, we’ll create an app on Heroku which prepares Heroku to receive your source code. We’ll use the Heroku CLI to get started.

$ git init
Initialized empty Git repository in /path/.git/
$ heroku create
Creating app... done, stack is cedar-14
https://sleepy-citadel-45065.herokuapp.com/ | https://git.heroku.com/sleepy-citadel-45065.git
When you create an app, a git remote (called heroku) is also created and associated with your local git repository. Heroku also generates a random name (in this case sleepy-citadel-45065) for your app.

Heroku recognizes an app as Node.js by the existence of a package.json file in the root directory. Create a file called package.json and copy the following into it:

{
  "name": "MEAN",
  "version": "1.0.0",
  "description": "A MEAN app that allows users to manage contact lists",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  "dependencies": {
    "body-parser": "^1.13.3",
    "express": "^4.13.3",
    "mongodb": "^2.1.6"
  }
}
The package.json file determines the version of Node.js that will be used to run your application on Heroku, as well as the dependencies that should be installed with your application. When an app is deployed, Heroku reads this file and installs the appropriate Node.js version together with the dependencies using the npm install command.

To prepare your system for running the app locally, run this command in your local directory to install the dependencies:

$ npm install
After dependencies are installed, you will be ready to run your app locally.

Provision a MongoDB Database
After you set up your application and file directory, create a MongoDB instance to persist your application’s data. We’ll use the mLab hosted database, a fully managed MongoDB service, to easily provision a new MongoDB database:

Sign up for a free mLab account.
Create a new single-node Sandbox MongoDB database in US EAST.
You should now see a mLab Sandbox database in your account.
Click on the database you just created.
Click the notification telling you to create a user.
Enter a username and password
When you create a mLab database, you will be given a MongoDB connection string. This string contains the credentials to access your database, so it’s best practice to store the value in a config variable. Let’s go ahead and store the connection string in a config var called MONGODB_URI:

heroku config:set MONGODB_URI=mongodb://your-user:your-pass@host:port/db-name
You can access this variable in Node.js as process.env.MONGODB_URI, which we will do later.

Now that our database is ready, we can start coding.

Connect MongoDB and the App Server Using the Node.js Driver
There are two popular MongoDB drivers that Node.js developers use: the official Node.js driver and an object document mapper called Mongoose that wraps the Node.js driver (similar to a SQL ORM). Both have their advantages, but for this example we will use the official Node.js driver.

Create a file called server.js. In this file we’ll create a new Express application and connect to our mLab database.

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW
There are a few things to note regarding connecting to the database:

We want to use our database connection pool as often as possible to best manage our available resources. We initialize the db variable in the global scope so that the connection can be used by all the route handlers.
We initialize the app only after the database connection is ready. This ensures that the application won’t crash or error out by trying database operations before the connection is established.
Now our app and database are connected. Next we will implement the RESTful API server by first defining all the endpoints.

Create a RESTful API Server with Node.js and Express
As our first step in creating the API, we define the endpoints (or data) we want to expose. Our contact list app will allow users to perform CRUD operations on their contacts.

The endpoints we’ll need are:

/contacts

Method	Description
GET	Find all contacts
POST	Create a new contact
/contacts/:id

Method	Description
GET	Find a single contact by ID
PUT	Update entire contact document
DELETE	Delete a contact by ID
Now we’ll add the routes to our server.js file:

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/contacts", function(req, res) {
});

app.post("/contacts", function(req, res) {
});

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
});

app.put("/contacts/:id", function(req, res) {
});

app.delete("/contacts/:id", function(req, res) {
});