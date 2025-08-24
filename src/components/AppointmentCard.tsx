interface AppointmentDetails {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  reason: string;
  status: string;
}

interface AppointmentCardProps {
  appointment: AppointmentDetails;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-gray-800">Appointment Confirmed!</h3>
        <p className="text-sm text-gray-600">Your appointment has been successfully booked</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Appointment ID:</span>
            <span className="text-sm font-mono text-gray-800">{appointment.appointmentId}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Patient:</span>
            <span className="text-sm text-gray-800">{appointment.patientName}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Doctor:</span>
            <span className="text-sm text-gray-800">{appointment.doctorName}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Date:</span>
            <span className="text-sm text-gray-800">{formatDate(appointment.appointmentDate)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Time:</span>
            <span className="text-sm text-gray-800">{appointment.startTime} - {appointment.endTime}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Type:</span>
            <span className="text-sm text-gray-800 capitalize">{appointment.type}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full capitalize">
              {appointment.status}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div>
            <span className="text-sm font-medium text-gray-600 block mb-1">Reason:</span>
            <span className="text-sm text-gray-800">{appointment.reason}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="text-blue-500 mr-2 mt-0.5">ℹ️</div>
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Important Reminders:</p>
            <ul className="space-y-1">
              <li>• Please arrive 15 minutes before your appointment</li>
              <li>• Bring your ID and insurance card</li>
              <li>• You'll receive a confirmation email shortly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
