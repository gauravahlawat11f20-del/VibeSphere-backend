const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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

app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";
const vercelPreviewPrefix =
  process.env.VERCEL_PREVIEW_PREFIX || "vibe-sphere-frontend-";
const vercelPreviewRegex = new RegExp(
  `^https:\\/\\/${vercelPreviewPrefix}.*\\.vercel\\.app$`
);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(
      "[CORS] Origin:",
      origin,
      "| Allowed:",
      allowedOrigins,
      "| Allow previews:",
      allowVercelPreviews
    );
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowVercelPreviews && vercelPreviewRegex.test(origin))
      return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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
