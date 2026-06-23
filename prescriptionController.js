const PDFDocument = require('pdfkit');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { getIO } = require('../realtime/io');

exports.createPrescription = async (req, res) => {
  const { appointmentId, diagnosis, medicines, advice, followUpDate } = req.body;
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'doctor',
        select: 'user',
      })
      .populate('patient', 'name email');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Ensure the logged-in doctor owns this appointment
    if (!appointment.doctor?.user || String(appointment.doctor.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const existing = await Prescription.findOne({ appointment: appointmentId });
    if (existing) {
      return res.status(400).json({ message: 'Prescription already exists for this appointment' });
    }

    // Only allow prescription after payment success
    if (appointment.paymentStatus !== 'success') {
      return res
        .status(400)
        .json({ message: 'Prescription can be added only after payment is completed.' });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId,
      doctor: appointment.doctor._id,
      patient: appointment.patient,
      diagnosis,
      medicines,
      advice,
      followUpDate,
    });

    // Mark appointment as completed once prescription is issued
    appointment.status = 'completed';
    await appointment.save();

    const io = getIO();
    if (io) {
      io.to(String(appointment.patient._id)).emit('prescription:new', {
        appointmentId: String(appointmentId),
        prescriptionId: String(prescription._id),
      });
      if (appointment.doctor?.user) {
        io.to(String(appointment.doctor.user)).emit('appointment:updated', appointment);
      }
    }

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Create prescription failed', error: err.message });
  }
};

exports.getByAppointment = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointment: req.params.appointmentId })
      .populate('doctor')
      .populate('patient', 'name email');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Fetch prescription failed', error: err.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('patient', 'name email');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=prescription-${prescription._id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text('E-Prescription', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Doctor: ${prescription.doctor.user.name}`);
    doc.text(`Patient: ${prescription.patient.name}`);
    doc.text(`Diagnosis: ${prescription.diagnosis}`);
    doc.moveDown();

    doc.fontSize(14).text('Medicines:');
    prescription.medicines.forEach((m, idx) => {
      doc.fontSize(12).text(
        `${idx + 1}. ${m.name} - ${m.dosage}, ${m.frequency}, ${m.duration}${
          m.notes ? ' (' + m.notes + ')' : ''
        }`
      );
    });

    if (prescription.advice) {
      doc.moveDown();
      doc.fontSize(12).text(`Advice: ${prescription.advice}`);
    }

    if (prescription.followUpDate) {
      doc.moveDown();
      doc.text(`Follow-up: ${prescription.followUpDate.toDateString()}`);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Download PDF failed', error: err.message });
  }
};

