const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getMyMedicalHistory,
  upsertMyMedicalHistory,
  getPatientMedicalHistory,
} = require('../controllers/medicalHistoryController');

const router = express.Router();

router.get('/me', auth, authorize('patient'), getMyMedicalHistory);
router.put('/me', auth, authorize('patient'), upsertMyMedicalHistory);

router.get('/patient/:patientId', auth, authorize('doctor', 'admin'), getPatientMedicalHistory);

module.exports = router;

