const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getOverviewStats, listUsers, listAppointments, listDoctors, updateDoctor } = require('../controllers/adminController');

const router = express.Router();

router.use(auth, authorize('admin'));

router.get('/stats', getOverviewStats);
router.get('/users', listUsers);
router.get('/appointments', listAppointments);
router.get('/doctors', listDoctors);
router.patch('/doctors/:id', updateDoctor);

module.exports = router;

