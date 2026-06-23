const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bloodGroup: { type: String, trim: true },
    heightCm: { type: Number, min: 0 },
    weightKg: { type: Number, min: 0 },
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    pastSurgeries: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);

