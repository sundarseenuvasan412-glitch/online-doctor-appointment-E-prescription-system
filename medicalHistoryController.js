const MedicalHistory = require('../models/MedicalHistory');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const normalizeStringArray = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 100);

exports.getMyMedicalHistory = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const history = await MedicalHistory.findOne({ patient: req.user._id });
    res.json(
      history || {
        patient: req.user._id,
        bloodGroup: '',
        heightCm: null,
        weightKg: null,
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        pastSurgeries: [],
        notes: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Fetch medical history failed', error: err.message });
  }
};

exports.upsertMyMedicalHistory = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const payload = {
      bloodGroup: (req.body.bloodGroup || '').trim() || undefined,
      heightCm: req.body.heightCm !== '' && req.body.heightCm != null ? Number(req.body.heightCm) : undefined,
      weightKg: req.body.weightKg !== '' && req.body.weightKg != null ? Number(req.body.weightKg) : undefined,
      allergies: normalizeStringArray(req.body.allergies),
      chronicConditions: normalizeStringArray(req.body.chronicConditions),
      currentMedications: normalizeStringArray(req.body.currentMedications),
      pastSurgeries: normalizeStringArray(req.body.pastSurgeries),
      notes: (req.body.notes || '').trim() || undefined,
      emergencyContact: {
        name: (req.body.emergencyContact?.name || '').trim() || undefined,
        phone: (req.body.emergencyContact?.phone || '').trim() || undefined,
        relationship: (req.body.emergencyContact?.relationship || '').trim() || undefined,
      },
    };

    const history = await MedicalHistory.findOneAndUpdate(
      { patient: req.user._id },
      { $set: { patient: req.user._id, ...payload } },
      { new: true, upsert: true }
    );

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Save medical history failed', error: err.message });
  }
};

exports.getPatientMedicalHistory = async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const patientId = req.params.patientId;

    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user._id }).select('_id');
      if (!doctorProfile) {
        return res.status(403).json({ message: 'Doctor profile not found' });
      }

      const hasRelationship = await Appointment.exists({
        doctor: doctorProfile._id,
        patient: patientId,
      });

      if (!hasRelationship) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }

    const history = await MedicalHistory.findOne({ patient: patientId });
    if (!history) {
      return res.status(404).json({ message: 'Medical history not found' });
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Fetch patient medical history failed', error: err.message });
  }
};

