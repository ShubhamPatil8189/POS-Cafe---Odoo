require('dotenv').config();
const Razorpay = require('razorpay');

async function testNetwork() {
  console.log('Testing Razorpay Network connection...');
  
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!key_id || !key_secret || key_id === 'your_test_key_id') {
      console.error('❌ Keys not set correctly in .env. Current ID:', key_id);
      process.exit(1);
  }

  try {
      const instance = new Razorpay({
          key_id: key_id,
          key_secret: key_secret,
      });

      // Attempt to create a mock order for 1 INR (100 paise)
      const options = {
          amount: 100,  
          currency: "INR",
          receipt: "test_receipt_1",
      };

      console.log('Sending request to Razorpay API...');
      const order = await instance.orders.create(options);
      console.log('✅ Connection Successful! Razorpay returned order data:');
      console.log(order);
      process.exit(0);
  } catch (error) {
      console.error('❌ Connection Failed! Error details:');
      console.error(error);
      process.exit(1);
  }
}

testNetwork();
