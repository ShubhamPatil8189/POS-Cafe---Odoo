// socket/index.js — Person 4 will add real-time handlers here
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Person 4: Add kitchen display, order updates, customer display events here
    // Example events to implement:
    // - 'order:new' — broadcast new order to kitchen
    // - 'order:status' — update order status
    // - 'kitchen:update' — kitchen sends status back to POS

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
};
