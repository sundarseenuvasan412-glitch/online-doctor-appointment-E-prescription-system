const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getMyAvailability,
  updateMyAvailability,
  getDoctorSlotsForDate,
} = require('../controllers/doctorController');

const router = express.Router();

router.get('/me/availability', auth, authorize('doctor'), getMyAvailability);
router.put('/me/availability', auth, authorize('doctor'), updateMyAvailability);

router.get('/:doctorId/slots', auth, getDoctorSlotsForDate);

module.exports = router;

