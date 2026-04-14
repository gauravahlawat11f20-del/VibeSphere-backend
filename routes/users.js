const router = require("express").Router();
const { getProfile, updateProfile, followUser, searchUsers, getSuggestedUsers } = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");
const { upload } = require("../config/cloudinary");

router.get("/search", verifyToken, searchUsers);
router.get("/suggested", verifyToken, getSuggestedUsers);
router.get("/:username", verifyToken, getProfile);
router.put("/update", verifyToken, upload.single("profilePic"), updateProfile);
router.put("/follow/:id", verifyToken, followUser);

module.exports = router;
