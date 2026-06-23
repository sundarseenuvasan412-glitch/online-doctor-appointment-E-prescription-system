require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Doctor.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@hospital.com',
      password: 'Admin@123',
      role: 'admin',
    });

    const patient = await User.create({
      name: 'John Patient',
      email: 'patient@example.com',
      password: 'Patient@123',
      role: 'patient',
    });

    const docUser = await User.create({
      name: 'Dr. Sarah Smith',
      email: 'doctor@example.com',
      password: 'Doctor@123',
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      user: docUser._id,
      specialization: 'Cardiologist',
      qualifications: 'MBBS, MD (Cardiology)',
      experienceYears: 10,
      bio: 'Experienced cardiologist with a passion for preventive care.',
      clinicName: 'City Heart Clinic',
      consultationFee: 800,
      availability: [
        { dayOfWeek: 1, slots: ['10:00', '10:30', '11:00', '11:30'] },
        { dayOfWeek: 3, slots: ['14:00', '14:30', '15:00', '15:30'] },
      ],
    });

    console.log('Seeded users and doctors:');
    console.log({
      admin: { email: admin.email, password: 'Admin@123' },
      patient: { email: patient.email, password: 'Patient@123' },
      doctor: { email: docUser.email, password: 'Doctor@123' },
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
};

seed();

