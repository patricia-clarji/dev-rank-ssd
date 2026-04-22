const express = require("express");
const publicController = require("../../controllers/publicPageController");

const router = express.Router();

router.get("/", publicController.landing);
router.get("/user/:username", publicController.publicProfile);

module.exports = router;
