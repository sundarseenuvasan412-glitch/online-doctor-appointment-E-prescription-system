const express = require('express');
const {
  askHealthBot,
  askAppointmentAssistant,
  askFaqBot,
  askTriageAssistant,
} = require('../controllers/chatbotController');

const router = express.Router();

// General health assistant (works even without login)
router.post('/ask', askHealthBot);

// AI appointment assistant (understands booking / reschedule / cancel intent)
router.post('/appointment', askAppointmentAssistant);

// AI FAQ / support bot
router.post('/faq', askFaqBot);

// AI triage assistant used inside the booking screen
router.post('/triage', askTriageAssistant);

module.exports = router;

