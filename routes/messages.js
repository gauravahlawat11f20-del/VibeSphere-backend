const router = require("express").Router();
const { getConversation, sendMessage, getChats } = require("../controllers/messageController");
const verifyToken = require("../middleware/verifyToken");

router.get("/chats", verifyToken, getChats);
router.get("/:userId", verifyToken, getConversation);
router.post("/:userId", verifyToken, sendMessage);

module.exports = router;
