const { validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

exports.registerPatient = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { name, email, password, phone } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, phone, role: 'patient' });
    const token = generateToken(user);
    res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { email, password } = req.body;
  try {
    const identifier = (email || '').trim().toLowerCase();

    // Support old logins that used phone number as the primary identifier,
    // as well as new logins that use email.
    const query =
      identifier && identifier.includes('@')
        ? { email: identifier }
        : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Admin creates doctor user + profile
exports.createDoctor = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { name, email, password, phone, specialization, qualifications, experienceYears, bio, clinicName, consultationFee, image } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, phone, role: 'doctor' });
    const doctor = await Doctor.create({
      user: user._id,
      specialization: specialization || '',
      qualifications: qualifications || '',
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      bio: bio || '',
      clinicName: clinicName || '',
      consultationFee: consultationFee ? Number(consultationFee) : 0,
      image: image || '',
    });
    res.status(201).json({ user: { ...user.toObject(), password: undefined }, doctor });
  } catch (err) {
    res.status(500).json({ message: 'Create doctor failed', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

