let ioInstance = null;

function initRealtime(httpServer) {
  // Lazy require to avoid coupling if not used
  const { Server } = require('socket.io');
  ioInstance = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
    path: '/socket.io',
  });

  ioInstance.on('connection', (socket) => {
    // Optionally join rooms by user or course in the future
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (userId) socket.join(`user:${userId}`);

    socket.on('disconnect', () => {});
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

function broadcast(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}

module.exports = { initRealtime, getIO, emitToUser, broadcast };


