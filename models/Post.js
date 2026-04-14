const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 2200 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    hashtags: [{ type: String }],
  },
  { timestamps: true }
);

postSchema.index({ caption: "text", hashtags: "text" });

module.exports = mongoose.model("Post", postSchema);
