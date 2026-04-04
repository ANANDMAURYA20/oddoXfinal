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

  // Create separate namespaces for authenticated staff and public customers
  // ─── Staff Namespace (authenticated) ───
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.split(" ")[1];
      const isCustomer = socket.handshake.auth.isCustomer;

      // Allow unauthenticated customer connections
      if (isCustomer) {
        socket.isCustomer = true;
        socket.customerTenantId = socket.handshake.auth.tenantId;
        socket.customerOrderId = socket.handshake.auth.orderId;
        return next();
      }

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
    // ─── Customer socket (for order tracking) ───
    if (socket.isCustomer) {
      logger.info(`📱 Customer socket connected: ${socket.id}`);

      // Join order-specific room for real-time tracking
      if (socket.customerOrderId) {
        const orderRoom = `order_${socket.customerOrderId}`;
        socket.join(orderRoom);
        logger.info(`📱 Customer ${socket.id} joined order room: ${orderRoom}`);
      }

      // Allow customer to track a specific order
      socket.on("customer:track-order", (orderId) => {
        if (orderId) {
          const orderRoom = `order_${orderId}`;
          socket.join(orderRoom);
          logger.info(`📱 Customer ${socket.id} tracking order: ${orderId}`);
        }
      });

      socket.on("disconnect", () => {
        logger.info(`📱 Customer socket disconnected: ${socket.id}`);
      });

      return;
    }

    // ─── Staff socket (authenticated) ───
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

    // KOT (Kitchen Order Ticket) - forward to kitchen displays in same tenant
    socket.on("kot:send", (data) => {
      const tenantRoom = `tenant_${socket.tenantId}`;
      io.to(tenantRoom).emit("kot:new", {
        ...data,
        timestamp: new Date().toISOString(),
        sentBy: socket.user.id,
      });
      logger.info(`🎫 KOT sent to room ${tenantRoom} for Table ${data.tableNumber}`);
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

// Helper to emit order status updates to customer tracking rooms
const emitToOrder = (orderId, eventName, payload) => {
  if (io) {
    const room = `order_${orderId}`;
    io.to(room).emit(eventName, payload);
    logger.info(`📱 Emitted '${eventName}' to order room ${room}`);
  }
};

module.exports = { initSocketIO, emitToTenant, emitToKdsStation, emitToOrder };
