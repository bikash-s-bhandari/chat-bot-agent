import connectDB from '../lib/database';
import { Doctor } from '../models/Doctor';

const doctorsData = [
  {
    doctorId: 'D001001',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '(555) 123-4567',
    specialization: 'Cardiology',
    department: 'Cardiology',
    licenseNumber: 'MD123456',
    experience: 12,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00', isAvailable: true }, // Friday
    ],
    currentPatients: [],
    maxPatientsPerDay: 15,
    isActive: true,
  },
  {
    doctorId: 'D001002',
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    email: 'michael.chen@hospital.com',
    phone: '(555) 123-4568',
    specialization: 'Neurology',
    department: 'Neurology',
    licenseNumber: 'MD123457',
    experience: 8,
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '08:00', endTime: '14:00', isAvailable: true }, // Friday
    ],
    currentPatients: [],
    maxPatientsPerDay: 12,
    isActive: true,
  },
  {
    doctorId: 'D001003',
    firstName: 'Dr. Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@hospital.com',
    phone: '(555) 123-4569',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    licenseNumber: 'MD123458',
    experience: 15,
    availability: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '10:00', endTime: '16:00', isAvailable: true }, // Friday
      { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', isAvailable: true }, // Saturday
    ],
    currentPatients: [],
    maxPatientsPerDay: 18,
    isActive: true,
  },
  {
    doctorId: 'D001004',
    firstName: 'Dr. James',
    lastName: 'Wilson',
    email: 'james.wilson@hospital.com',
    phone: '(555) 123-4570',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    licenseNumber: 'MD123459',
    experience: 20,
    availability: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '15:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '07:00', endTime: '15:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '07:00', endTime: '15:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '07:00', endTime: '15:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '07:00', endTime: '13:00', isAvailable: true }, // Friday
    ],
    currentPatients: [],
    maxPatientsPerDay: 10,
    isActive: true,
  },
  {
    doctorId: 'D001005',
    firstName: 'Dr. Lisa',
    lastName: 'Thompson',
    email: 'lisa.thompson@hospital.com',
    phone: '(555) 123-4571',
    specialization: 'Obstetrics & Gynecology',
    department: 'Obstetrics',
    licenseNumber: 'MD123460',
    experience: 18,
    availability: [
      { dayOfWeek: 1, startTime: '08:30', endTime: '16:30', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '08:30', endTime: '16:30', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '08:30', endTime: '16:30', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '08:30', endTime: '16:30', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '08:30', endTime: '14:30', isAvailable: true }, // Friday
    ],
    currentPatients: [],
    maxPatientsPerDay: 14,
    isActive: true,
  },
];

async function seedDoctors() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing doctors...');
    await Doctor.deleteMany({});

    console.log('Seeding doctors...');
    const doctors = await Doctor.insertMany(doctorsData);

    console.log(`Successfully seeded ${doctors.length} doctors:`);
    doctors.forEach((doctor) => {
      console.log(`- Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`);
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDoctors();
