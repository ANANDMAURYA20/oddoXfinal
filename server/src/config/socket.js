const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./env");
const logger = require("../utils/logger");

let io;

const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Configure this in production to match your frontend domain
      methods: ["GET", "POST"],
    },
  });

  // Authentication Middleware for Sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.split(" ")[1];
      
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Attach tenant info to socket
      socket.user = decoded;
      socket.tenantId = decoded.tenantId;

      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid Token"));
    }
  });

  // Handle Connections
  io.on("connection", (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${socket.user.id}, Tenant: ${socket.tenantId})`);

    // Force the socket to join a Room strictly tied to their Tenant ID
    // This provides our Multi-Tenant isolation at the WebSocket level
    const tenantRoom = `tenant_${socket.tenantId}`;
    socket.join(tenantRoom);
    
    logger.info(`🏠 Socket ${socket.id} joined room: ${tenantRoom}`);

    socket.on("disconnect", () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper function to emit events safely from controllers/services
const emitToTenant = (tenantId, eventName, payload) => {
  if (io) {
    const room = `tenant_${tenantId}`;
    io.to(room).emit(eventName, payload);
    logger.info(`📡 Emitted '${eventName}' to room ${room}`);
  }
};

module.exports = { initSocketIO, emitToTenant };
