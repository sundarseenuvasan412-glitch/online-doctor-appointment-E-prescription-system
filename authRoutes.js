const express = require('express');
const { body } = require('express-validator');
const { registerPatient, login, createDoctor, getMe } = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  registerPatient
);

router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/doctors',
  auth,
  authorize('admin'),
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('specialization').notEmpty(),
  ],
  createDoctor
);

router.get('/me', auth, getMe);

module.exports = router;

