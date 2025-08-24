import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Doctor } from '@/models/Doctor';
import { Appointment } from '@/models/Appointment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'doctorId, date, and time are required' },
        { status: 400 }
      );
    }

    // Find the doctor
    const doctor = await Doctor.findOne({ 
      doctorId: doctorId,
      isActive: true 
    });

    if (!doctor) {
      return NextResponse.json(
        { available: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if the requested date and time is within doctor's availability
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const startTime = time;

    // Check doctor's availability for the requested day and time
    const availability = doctor.availability.find(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.isAvailable &&
      slot.startTime <= startTime && 
      slot.endTime > startTime
    );

    if (!availability) {
      return NextResponse.json({
        available: false,
        message: 'Doctor is not available at the requested time',
        availableSlots: doctor.availability
          .filter(slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
          .map(slot => ({
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek],
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctorId: doctorId,
      appointmentDate: appointmentDate,
      startTime: startTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        available: false,
        message: 'This time slot is already booked',
        availableSlots: doctor.availability
          .filter(slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
          .map(slot => ({
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek],
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Time slot is available',
      doctor: {
        doctorId: doctor.doctorId,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        department: doctor.department
      }
    });

  } catch (error) {
    console.error('Error checking doctor availability:', error);
    return NextResponse.json(
      { available: false, message: 'Error checking availability' },
      { status: 500 }
    );
  }
}
