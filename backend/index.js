require('dotenv').config();
const app = require('./app');
const { initDB } = require('./db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 POS Cafe server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Failed to initialize DB:", err);
});
