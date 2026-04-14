const router = require("express").Router();
const { createPost, getFeed, getUserPosts, likePost, commentPost, deletePost, bookmarkPost, searchPosts } = require("../controllers/postController");
const verifyToken = require("../middleware/verifyToken");
const { upload } = require("../config/cloudinary");

router.get("/feed", verifyToken, getFeed);
router.get("/search", verifyToken, searchPosts);
router.get("/user/:username", verifyToken, getUserPosts);
router.post("/", verifyToken, upload.single("image"), createPost);
router.put("/like/:id", verifyToken, likePost);
router.put("/comment/:id", verifyToken, commentPost);
router.put("/bookmark/:id", verifyToken, bookmarkPost);
router.delete("/:id", verifyToken, deletePost);

module.exports = router;
