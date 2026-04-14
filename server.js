const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");
const connectDB = require("./config/db");
const { initSocket } = require("./socket/socket");
const Story = require("./models/Story");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/stories", require("./routes/stories"));

// Delete expired stories every hour
cron.schedule("0 * * * *", async () => {
  await Story.deleteMany({ expiresAt: { $lt: new Date() } });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
