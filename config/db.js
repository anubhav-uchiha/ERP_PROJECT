// import the mongoose library which is used to interact with MongoDB
const mongoose = require("mongoose");

// create an asynchonous function to connect to the MongoDB database
const connectDB = async () => {
  try {
    /** attempt to connect to mongodb using the connection string stored in environment variable
     *  process.env.MONGO_URI comes from .env file
     */
    await mongoose.connect(process.env.MONGO_URI);
    // if the connection is successful, print a confirmation message to the console log
    console.log("MongoDB is Connected!");
  } catch (error) {
    // if there is an error during the connection attempt, print the error message
    console.log("Error", error.message);
    // exit the node.js process with a failure status code
    process.exit(1);
  }
};

// export the connectionDB function so it can be used in other files
module.exports = connectDB;
