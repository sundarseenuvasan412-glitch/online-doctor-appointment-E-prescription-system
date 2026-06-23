const express = require('express');
const { body } = require('express-validator');
const {
  searchDoctors,
  bookAppointment,
  getMyAppointments,
  updateStatus,
  payForAppointment,
} = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/doctors', auth, searchDoctors);

router.post(
  '/',
  auth,
  authorize('patient'),
  [
    body('doctorId').notEmpty(),
    body('date').notEmpty(),
    body('timeSlot').notEmpty(),
  ],
  bookAppointment
);

router.get('/mine', auth, getMyAppointments);

router.patch('/:id/status', auth, authorize('doctor', 'admin'), updateStatus);

router.post('/:id/pay', auth, authorize('patient'), payForAppointment);

module.exports = router;

