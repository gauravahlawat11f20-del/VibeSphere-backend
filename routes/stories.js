const router = require("express").Router();
const { createStory, getFeedStories, viewStory } = require("../controllers/storyController");
const verifyToken = require("../middleware/verifyToken");
const { upload } = require("../config/cloudinary");

router.get("/", verifyToken, getFeedStories);
router.post("/", verifyToken, upload.single("image"), createStory);
router.put("/view/:id", verifyToken, viewStory);

module.exports = router;
