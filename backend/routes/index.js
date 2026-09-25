const express = require('express');
const aiChatRouter = require('./aiChat');
const trustedRouter = require('./trustedQuery');

const router = express.Router();

router.use('/chat', aiChatRouter);
router.use('/trusted', trustedRouter);

module.exports = router;
