const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  createPrescription,
  getByAppointment,
  downloadPdf,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.post('/', auth, authorize('doctor'), createPrescription);
router.get('/by-appointment/:appointmentId', auth, getByAppointment);
router.get('/:id/pdf', auth, downloadPdf);

module.exports = router;

