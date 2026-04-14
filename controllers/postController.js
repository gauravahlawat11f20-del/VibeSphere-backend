const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getSocketId, io } = require("../socket/socket");

exports.createPost = async (req, res, next) => {
  try {
    const { caption } = req.body;
    const hashtags = (caption.match(/#\w+/g) || []).map((t) => t.toLowerCase());
    const post = await Post.create({
      user: req.userId,
      image: req.file ? req.file.path : "",
      caption,
      hashtags,
    });
    const populated = await post.populate("user", "username profilePic");
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

exports.getFeed = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select("following");
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const posts = await Post.find({ user: { $in: [...me.following, req.userId] } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    res.json(posts);
  } catch (err) { next(err); }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePic");
    res.json(posts);
  } catch (err) { next(err); }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(req.userId);
    const update = liked
      ? { $pull: { likes: req.userId } }
      : { $addToSet: { likes: req.userId } };

    await Post.findByIdAndUpdate(req.params.id, update);

    if (!liked && post.user.toString() !== req.userId) {
      const notif = await Notification.create({
        recipient: post.user,
        sender: req.userId,
        type: "like",
        post: post._id,
      });
      const socketId = getSocketId(post.user.toString());
      if (socketId) io.to(socketId).emit("notification", notif);
    }

    res.json({ liked: !liked });
  } catch (err) { next(err); }
};

exports.commentPost = async (req, res, next) => {
  try {
    const { text } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.userId, text } } },
      { new: true }
    ).populate("comments.user", "username profilePic");

    if (post.user.toString() !== req.userId) {
      const notif = await Notification.create({
        recipient: post.user,
        sender: req.userId,
        type: "comment",
        post: post._id,
      });
      const socketId = getSocketId(post.user.toString());
      if (socketId) io.to(socketId).emit("notification", notif);
    }

    res.json(post.comments);
  } catch (err) { next(err); }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.userId)
      return res.status(403).json({ message: "Unauthorized" });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) { next(err); }
};

exports.bookmarkPost = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId);
    const bookmarked = me.bookmarks.includes(req.params.id);
    const update = bookmarked
      ? { $pull: { bookmarks: req.params.id } }
      : { $addToSet: { bookmarks: req.params.id } };
    await User.findByIdAndUpdate(req.userId, update);
    res.json({ bookmarked: !bookmarked });
  } catch (err) { next(err); }
};

exports.searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const posts = await Post.find({ $text: { $search: q } })
      .populate("user", "username profilePic")
      .limit(20);
    res.json(posts);
  } catch (err) { next(err); }
};
