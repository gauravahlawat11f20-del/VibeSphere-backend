const { Server } = require("socket.io");

let io;
const onlineUsers = {};

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
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
