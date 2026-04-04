const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id: 'rzp_test_SZPJgRzIwA6PO6',
  key_secret: 'VV83RfriGQxUZ2TtfRFaiHnz',
});

async function run() {
  try {
    const order = await rzp.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: 'receipt_order_123',
      notes: {
        orderId: 123,
        orderNumber: 'ORD-123'
      }
    });
    console.log("Success:", order);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
