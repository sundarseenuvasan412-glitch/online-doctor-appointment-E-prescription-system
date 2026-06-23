const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { getIO } = require('../realtime/io');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

exports.searchDoctors = async (req, res) => {
  const { specialization, name } = req.query;
  const query = {};
  if (specialization) query.specialization = new RegExp(specialization, 'i');
  if (name) query['$text'] = { $search: name };
  try {
    const doctors = await Doctor.find(query).populate('user', '-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Search doctors failed', error: err.message });
  }
};

const generatePaymentRef = () =>
  `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

exports.bookAppointment = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  const { doctorId, date, timeSlot, reason, mode } = req.body;
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const day = new Date(date);
    if (Number.isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    const dayOfWeek = day.getDay();

    const availabilityForDay =
      (doctor.availability || []).find((a) => a.dayOfWeek === dayOfWeek) || null;

    if (!availabilityForDay || !availabilityForDay.slots.includes(timeSlot)) {
      return res
        .status(400)
        .json({ message: 'Selected time slot is not available for this doctor on this date' });
    }

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const exists = await Appointment.exists({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $nin: ['cancelled', 'rejected'] },
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: 'This slot is already booked for the selected date' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      timeSlot,
      reason,
      mode,
      paymentStatus: 'pending',
      paymentAmount: doctor.consultationFee || 500,
    });

    const io = getIO();
    if (io && doctor.user) {
      io.to(String(doctor.user)).emit('appointment:new', appointment);
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'patient') {
      filter = { patient: req.user._id };
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user._id }).select('_id');
      if (!doctorProfile) {
        return res.json([]);
      }
      filter = { doctor: doctorProfile._id };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .sort({ date: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Fetch appointments failed', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: 'doctor',
      select: 'user',
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.status = status;
    await appointment.save();

    const io = getIO();
    if (io) {
      io.to(String(appointment.patient)).emit('appointment:updated', appointment);
      if (appointment.doctor?.user) {
        io.to(String(appointment.doctor.user)).emit('appointment:updated', appointment);
      }
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Update appointment failed', error: err.message });
  }
};

exports.payForAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: 'doctor',
      select: 'user',
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({ message: 'Appointment must be approved before payment' });
    }

    if (appointment.paymentStatus === 'success') {
      return res.json(appointment);
    }

    appointment.paymentStatus = 'success';
    appointment.paymentRef = generatePaymentRef();
    appointment.paidAt = new Date();
    appointment.status = 'scheduled';
    await appointment.save();

    const io = getIO();
    if (io) {
      io.to(String(appointment.patient)).emit('appointment:updated', appointment);
      if (appointment.doctor?.user) {
        io.to(String(appointment.doctor.user)).emit('appointment:updated', appointment);
      }
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Payment failed', error: err.message });
  }
};

