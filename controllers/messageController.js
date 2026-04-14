const Message = require("../models/Message");
const { getSocketId, io } = require("../socket/socket");

exports.getConversation = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: req.params.userId, receiver: req.userId, seen: false },
      { seen: true }
    );

    res.json(messages);
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const message = await Message.create({
      sender: req.userId,
      receiver: req.params.userId,
      text,
    });

    const socketId = getSocketId(req.params.userId);
    if (socketId) io.to(socketId).emit("newMessage", message);

    res.status(201).json(message);
  } catch (err) { next(err); }
};

exports.getChats = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { receiver: req.userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "username profilePic");

    const seen = new Set();
    const chats = [];
    for (const msg of messages) {
      const other = msg.sender._id.toString() === req.userId
        ? msg.receiver
        : msg.sender;
      if (!seen.has(other._id.toString())) {
        seen.add(other._id.toString());
        chats.push({ user: other, lastMessage: msg });
      }
    }
    res.json(chats);
  } catch (err) { next(err); }
};
