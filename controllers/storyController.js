const Story = require("../models/Story");
const User = require("../models/User");

exports.createStory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image required" });
    const story = await Story.create({ user: req.userId, image: req.file.path });
    res.status(201).json(story);
  } catch (err) { next(err); }
};

exports.getFeedStories = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select("following");
    const stories = await Story.find({
      user: { $in: [...me.following, req.userId] },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePic");

    const grouped = {};
    for (const s of stories) {
      const uid = s.user._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.user, stories: [] };
      grouped[uid].stories.push(s);
    }
    res.json(Object.values(grouped));
  } catch (err) { next(err); }
};

exports.viewStory = async (req, res, next) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.userId },
    });
    res.json({ message: "Viewed" });
  } catch (err) { next(err); }
};
