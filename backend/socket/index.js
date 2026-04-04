const { Server } = require('socket.io');

module.exports = function initializeSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173', // Vite default port
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Export io via app so controllers can access it 
  // (e.g. req.app.get('io').emit(...))
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`📡 Socket connected: ${socket.id}`);

    // Kitchen listeners
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
      console.log(`[Socket ${socket.id}] joined room: kitchen`);
    });

    // Customer display listeners
    socket.on('join:customer-display', (orderId) => {
      socket.join(`customer:${orderId}`);
      console.log(`[Socket ${socket.id}] joined room: customer:${orderId}`);
    });

    // POS listeners
    socket.on('join:pos', () => {
      socket.join('pos');
      console.log(`[Socket ${socket.id}] joined room: pos`);
    });

    socket.on('disconnect', () => {
      console.log(`🚫 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
