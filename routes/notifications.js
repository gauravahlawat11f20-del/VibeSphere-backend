const router = require("express").Router();
const { getNotifications, markAllRead } = require("../controllers/notificationController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, getNotifications);
router.put("/read", verifyToken, markAllRead);

module.exports = router;
