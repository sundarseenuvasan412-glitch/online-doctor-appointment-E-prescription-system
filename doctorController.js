const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const normalizeAvailability = (availability = []) =>
  (Array.isArray(availability) ? availability : [])
    .map((item) => ({
      dayOfWeek: Number(item.dayOfWeek),
      slots: Array.isArray(item.slots)
        ? item.slots
            .map((s) => String(s || '').trim())
            .filter(Boolean)
        : [],
    }))
    .filter(
      (item) =>
        Number.isInteger(item.dayOfWeek) &&
        item.dayOfWeek >= 0 &&
        item.dayOfWeek <= 6 &&
        item.slots.length > 0
    );

exports.getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('availability');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    res.json(doctor.availability || []);
  } catch (err) {
    res.status(500).json({ message: 'Fetch availability failed', error: err.message });
  }
};

exports.updateMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const availability = normalizeAvailability(req.body.availability);
    doctor.availability = availability;
    await doctor.save();

    res.json(doctor.availability);
  } catch (err) {
    res.status(500).json({ message: 'Update availability failed', error: err.message });
  }
};

exports.getDoctorSlotsForDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query param is required (YYYY-MM-DD)' });
    }

    const doctor = await Doctor.findById(doctorId).select('availability');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const day = new Date(date);
    if (Number.isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    const dayOfWeek = day.getDay(); // 0-6

    const availabilityForDay =
      (doctor.availability || []).find((a) => a.dayOfWeek === dayOfWeek) || null;

    if (!availabilityForDay) {
      return res.json({ slots: [] });
    }

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'rejected'] },
    }).select('timeSlot');

    const bookedSet = new Set(existingAppointments.map((a) => a.timeSlot));

    const slots = availabilityForDay.slots.map((slot) => ({
      timeSlot: slot,
      booked: bookedSet.has(slot),
    }));

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: 'Fetch slots failed', error: err.message });
  }
};

