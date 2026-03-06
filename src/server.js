//load environment variable from .env file into process.env
require("dotenv").config();

//import the express application from app.js file
const app = require("./app.js");

//import the database connection function from the db.js file
const connectDB = require("../config/db.js");

// get the PORT number from the environment variable
const PORT = process.env.PORT || 9000;

// function responsible for starting the server
const startServer = async () => {
  try {
    /** first connect to the database
     *  we wait for the database connection before starting the server
     *  this prevents the server from running if the database fails
     */
    await connectDB();

    // start the express server on the specified port
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // if database connection fails, log the error
    console.log("Fail to Start the Server", error.message);
    // stop the node.js process because the server cannot run without database
    process.exit(1);
  }
};

// call the function to start the server
startServer();
