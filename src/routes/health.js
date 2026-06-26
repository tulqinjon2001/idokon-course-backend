const { BOT_MODE } = require("../config/env");

function createHealthRouter() {
  const express = require("express");
  const router = express.Router();

  router.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      service: "quiz-telegram",
      mode: BOT_MODE,
      time: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = { createHealthRouter };
