const Notification = require("../models/Notification");

exports.getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "username profilePic")
      .populate("post", "image");
    res.json(notifs);
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.userId }, { read: true });
    res.json({ message: "All marked as read" });
  } catch (err) { next(err); }
};
