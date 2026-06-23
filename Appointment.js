const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'scheduled', 'rejected', 'cancelled', 'completed'],
      default: 'pending'
    },
    reason: { type: String },
    notes: { type: String },
    mode: { type: String, enum: ['online', 'in-person'], default: 'online' },
    // payment details (dummy payment flow)
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paymentAmount: { type: Number, default: 500 },
    paymentRef: { type: String },
    paidAt: { type: Date },
    autoCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);

