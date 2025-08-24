'use client';

import { useState, useEffect } from 'react';

interface Doctor {
  doctorId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  experience: number;
}

interface AppointmentFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export default function AppointmentForm({ onSubmit, onCancel }: AppointmentFormProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [formData, setFormData] = useState({
    // Patient Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    
    // Appointment Information
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    type: 'consultation',
    reason: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if doctor is not available
    if (availabilityStatus === 'unavailable') {
      alert('Please select an available time slot before submitting.');
      return;
    }
    
    if (availabilityStatus === 'checking') {
      alert('Please wait while we check availability.');
      return;
    }
    
    setLoading(true);
    
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkDoctorAvailability = async (doctorId: string, date: string, time: string) => {
    try {
      const response = await fetch(`/api/doctors/availability?doctorId=${doctorId}&date=${date}&time=${time}`);
      if (response.ok) {
        return await response.json();
      }
      return { available: false, message: 'Unable to check availability' };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, message: 'Error checking availability' };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check availability when doctor, date, or time changes
    if ((name === 'doctorId' || name === 'appointmentDate' || name === 'startTime') && 
        formData.doctorId && formData.appointmentDate && formData.startTime) {
      checkAvailability();
    }
  };

  const checkAvailability = async () => {
    if (!formData.doctorId || !formData.appointmentDate || !formData.startTime) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return;
    }

    setAvailabilityStatus('checking');
    setAvailabilityMessage('Checking availability...');

    try {
      const result = await checkDoctorAvailability(formData.doctorId, formData.appointmentDate, formData.startTime);
      
      if (result.available) {
        setAvailabilityStatus('available');
        setAvailabilityMessage('✅ Time slot is available');
      } else {
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setAvailabilityStatus('unavailable');
      setAvailabilityMessage('❌ Error checking availability');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Patient Registration & Appointment Booking</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Information Section */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-700 mb-3">👤 Patient Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Appointment Information Section */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">🏥 Appointment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.doctorId} value={doctor.doctorId}>
                    Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {availabilityMessage && (
                <div className={`mt-1 text-sm ${
                  availabilityStatus === 'available' ? 'text-green-600' :
                  availabilityStatus === 'unavailable' ? 'text-red-600' :
                  availabilityStatus === 'checking' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {availabilityMessage}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="routine">Routine Check-up</option>
                <option value="emergency">Emergency</option>
                <option value="specialist">Specialist</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Please describe your symptoms or reason for the appointment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || availabilityStatus === 'unavailable' || availabilityStatus === 'checking'}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking Appointment...' : 
             availabilityStatus === 'unavailable' ? '❌ Time Not Available' :
             availabilityStatus === 'checking' ? '⏳ Checking...' :
             '📅 Book Appointment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
