const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

exports.getOverviewStats = async (req, res) => {
  try {
    const [patients, doctors, appointments, upcoming] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: { $gte: new Date() } }),
    ]);

    res.json({
      patients,
      doctors,
      appointments,
      upcomingAppointments: upcoming,
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch stats failed', error: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Fetch users failed', error: err.message });
  }
};

exports.listAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Fetch appointments failed', error: err.message });
  }
};

exports.listDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Fetch doctors failed', error: err.message });
  }
};

exports.updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { specialization, qualifications, experienceYears, bio, clinicName, clinicAddress, consultationFee, image, availability } = req.body;
  try {
    const doctor = await Doctor.findById(id).populate('user', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (specialization !== undefined) doctor.specialization = specialization;
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears);
    if (bio !== undefined) doctor.bio = bio;
    if (clinicName !== undefined) doctor.clinicName = clinicName;
    if (clinicAddress !== undefined) doctor.clinicAddress = clinicAddress;
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (image !== undefined) doctor.image = image;
    if (availability !== undefined) doctor.availability = availability;
    await doctor.save();
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Update doctor failed', error: err.message });
  }
};

