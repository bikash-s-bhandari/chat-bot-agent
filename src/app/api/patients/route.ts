import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Patient } from '@/models/Patient';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const patientData = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'address'];
    for (const field of requiredFields) {
      if (!patientData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if patient already exists with same email
    const existingPatient = await Patient.findOne({ email: patientData.email.toLowerCase() });
    if (existingPatient) {
      return NextResponse.json(
        { error: 'A patient with this email already exists' },
        { status: 409 }
      );
    }

    // Create new patient
    const patient = new Patient({
      ...patientData,
      email: patientData.email.toLowerCase(),
      symptoms: patientData.symptoms || []
    });

    await patient.save();

    return NextResponse.json({ 
      patient: {
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      const patient = await Patient.findOne({ email: email.toLowerCase() })
        .select('patientId firstName lastName email phone assignedDepartment');
      
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      
      return NextResponse.json({ patient });
    }

    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}



