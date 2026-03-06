// import the express framework to create a web server
const express = require("express");

// import CORS middleware to allow requests from different domains
const cors = require("cors");

// create an express application instance
const app = express();

/** Enable CORSfor all incoming requests
 *  this allows frontend apps to call this API
 */
app.use(cors());
/** enable built-in middleware to parse JSON data from request bodies
 *  this lets the server understand JSON sent from clients
 */
app.use(express.json());

/** Define a GET route for the root URL "/"
 *  when someone visits the base API endpoint, this function runs
 */
app.get("/", (req, res) => {
  // send a simple text respose back to the client
  return res.send("API is Running");
});

// export the express app so it can be used in another file
module.exports = app;
