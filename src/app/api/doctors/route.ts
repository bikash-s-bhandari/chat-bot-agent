import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Doctor } from '@/models/Doctor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const specialization = searchParams.get('specialization');
    const isActive = searchParams.get('isActive');

    let query: any = {};

    if (department) {
      query.department = department;
    }

    if (specialization) {
      query.specialization = specialization;
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const doctors = await Doctor.find(query)
      .select('doctorId firstName lastName specialization department experience availability isActive')
      .sort({ firstName: 1, lastName: 1 });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}
