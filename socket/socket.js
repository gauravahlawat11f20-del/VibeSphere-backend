const { Server } = require("socket.io");

let io;
const onlineUsers = {};

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";
const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === "true";
const vercelPreviewPrefix =
  process.env.VERCEL_PREVIEW_PREFIX || "vibe-sphere-frontend-";
const vercelPreviewRegex = new RegExp(
  `^https:\\/\\/${vercelPreviewPrefix}.*\\.vercel\\.app$`
);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowAllOrigins) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && vercelPreviewRegex.test(origin)) return true;
  return false;
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      onlineUsers[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(onlineUsers));
    }

    socket.on("disconnect", () => {
      delete onlineUsers[userId];
      io.emit("onlineUsers", Object.keys(onlineUsers));
    });
  });

  return io;
};

const getSocketId = (userId) => onlineUsers[userId];

module.exports = { initSocket, getSocketId, get io() { return io; } };
