require('dotenv').config();

const app = require("./src/app"); 
const connectDB = require("./src/config/db");
const { initCronJobs } = require('./src/config/cronService');
connectDB();

// 5. Initialize Background Workers
initCronJobs();



// 7. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});