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

    // If KDS_STAFF with a station assignment, also join the station-specific room
    if (socket.user.kdsStationId) {
      const stationRoom = `kds_${socket.user.kdsStationId}`;
      socket.join(stationRoom);
      logger.info(`🍳 Socket ${socket.id} joined KDS room: ${stationRoom}`);
    }

    // Allow clients to join a specific KDS station room dynamically
    socket.on("kds:join-station", (stationId) => {
      if (stationId) {
        const stationRoom = `kds_${stationId}`;
        socket.join(stationRoom);
        logger.info(`🍳 Socket ${socket.id} joined KDS room: ${stationRoom}`);
      }
    });

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

// Helper to emit events to a specific KDS station room
const emitToKdsStation = (stationId, eventName, payload) => {
  if (io) {
    const room = `kds_${stationId}`;
    io.to(room).emit(eventName, payload);
    logger.info(`🍳 Emitted '${eventName}' to KDS room ${room}`);
  }
};

module.exports = { initSocketIO, emitToTenant, emitToKdsStation };
