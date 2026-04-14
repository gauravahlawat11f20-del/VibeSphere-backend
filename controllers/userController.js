const User = require("../models/User");
const Notification = require("../models/Notification");
const { getSocketId, io } = require("../socket/socket");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password -refreshToken")
      .populate("followers following", "username profilePic");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, username } = req.body;
    const update = {};
    if (bio !== undefined) update.bio = bio;
    if (username) update.username = username;
    if (req.file) update.profilePic = req.file.path;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true })
      .select("-password -refreshToken");
    res.json(user);
  } catch (err) { next(err); }
};

exports.followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) return res.status(400).json({ message: "Cannot follow yourself" });

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);
    if (!target) return res.status(404).json({ message: "User not found" });

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(req.userId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: req.userId } }),
      ]);
    } else {
      await Promise.all([
        User.findByIdAndUpdate(req.userId, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.userId } }),
      ]);

      const notif = await Notification.create({
        recipient: targetId,
        sender: req.userId,
        type: "follow",
      });

      const socketId = getSocketId(targetId);
      if (socketId) io.to(socketId).emit("notification", notif);
    }

    res.json({ following: !isFollowing });
  } catch (err) { next(err); }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      username: { $regex: q, $options: "i" },
      _id: { $ne: req.userId },
    }).select("username profilePic bio").limit(10);
    res.json(users);
  } catch (err) { next(err); }
};

exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select("following");
    const users = await User.find({
      _id: { $ne: req.userId, $nin: me.following },
    }).select("username profilePic bio").limit(8);
    res.json(users);
  } catch (err) { next(err); }
};
