const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String }
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true
    },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis: { type: String, required: true },
    medicines: [MedicineSchema],
    advice: { type: String },
    followUpDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', PrescriptionSchema);

