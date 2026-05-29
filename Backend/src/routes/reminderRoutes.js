const express = require("express");
const multer = require("multer");
const router = express.Router();
const { createManualReminder, createAiReminder } = require("../controllers/reminder.controller");
const { isLoggedIn } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/reminders/manual
router.post("/manual", isLoggedIn, createManualReminder);

// POST /api/reminders/ai-upload
router.post("/ai-upload", isLoggedIn, upload.single("document"), createAiReminder);

module.exports = router;
