const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    image: { type: String, trim: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: { type: String },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String },
    clinicName: { type: String },
    clinicAddress: { type: String },
    consultationFee: { type: Number, default: 0 },
    // Simple availability model: days of week with slots
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
        slots: [{ type: String }] // e.g. "10:00", "10:30"
      }
    ],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', DoctorSchema);

