import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Appointment } from '@/models/Appointment';
import { Doctor, IDoctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const appointmentData = await request.json();

    // Validate required fields
    const requiredFields = ['patientId', 'doctorId', 'appointmentDate', 'startTime', 'type', 'reason'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if patient exists
    const patient = await Patient.findOne({ patientId: appointmentData.patientId });
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findOne({ 
      doctorId: appointmentData.doctorId,
      isActive: true 
    });
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found or not available' },
        { status: 404 }
      );
    }

    // Check if the requested time slot is available
    const appointmentDate = new Date(appointmentData.appointmentDate);
    const dayOfWeek = appointmentDate.getDay();
    const startTime = appointmentData.startTime;

    // Check doctor's availability for the requested day and time
    const availability = doctor.availability.find((slot: IDoctor['availability'][number]) => 
      slot.dayOfWeek === dayOfWeek && 
      slot.isAvailable &&
      slot.startTime <= startTime && 
      slot.endTime > startTime
    );

    if (!availability) {
      return NextResponse.json(
        { error: 'Doctor is not available at the requested time' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctorId: appointmentData.doctorId,
      appointmentDate: appointmentDate,
      startTime: startTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      ...appointmentData,
      appointmentDate: appointmentDate,
      status: 'scheduled'
    });

    await appointment.save();

    return NextResponse.json({ 
      appointment: {
        appointmentId: appointment.appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    const query: Record<string, unknown> = {};

    if (patientId) {
      query.patientId = patientId;
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, startTime: 1 });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
