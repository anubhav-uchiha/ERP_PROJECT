require("dotenv").config();
const app = require("./app.js");
const connectDB = require("../config/db.js");
const PORT = process.env.PORT || 9000;
const startServer = async (req, res) => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("Fail to Start the Server", error.message);
    process.exit(1);
  }
};

startServer();
