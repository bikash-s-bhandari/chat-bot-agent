'use client';

import { useState, useRef, useEffect } from 'react';
import AppointmentForm from './AppointmentForm';
import AppointmentCard from './AppointmentCard';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  nextAgent?: string;
  metadata?: Record<string, unknown>;
  showForm?: boolean;
  appointmentDetails?: any;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation context
    const updatedContext = [...conversationContext, { role: 'user' as const, content: inputMessage }];
    setConversationContext(updatedContext);
    
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          context: { previousMessages: updatedContext }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if the response indicates we should show the appointment form
        const shouldShowForm = data.response.toLowerCase().includes('form') || 
                              data.response.toLowerCase().includes('fill out') ||
                              (inputMessage.toLowerCase().includes('book') && data.response.toLowerCase().includes('appointment'));

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          confidence: data.confidence,
          nextAgent: data.nextAgent,
          metadata: data.metadata,
          showForm: shouldShowForm,
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation context with bot response
        setConversationContext(prev => [...prev, { role: 'assistant' as const, content: data.response }]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // First, create or find the patient
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }),
      });

      if (!patientResponse.ok) {
        throw new Error('Failed to create patient');
      }

      const patientData = await patientResponse.json();

      // Then, create the appointment
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientData.patient.patientId,
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          startTime: formData.startTime,
          type: formData.type,
          reason: formData.reason,
        }),
      });

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const appointmentData = await appointmentResponse.json();

      // Get doctor details for the card
      const doctorResponse = await fetch(`/api/doctors?doctorId=${formData.doctorId}`);
      const doctorData = await doctorResponse.json();
      const doctor = doctorData.doctors?.[0];

      // Create appointment details for the card
      const appointmentDetails = {
        appointmentId: appointmentData.appointment.appointmentId,
        patientId: patientData.patient.patientId,
        patientName: `${formData.firstName} ${formData.lastName}`,
        doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
        appointmentDate: formData.appointmentDate,
        startTime: appointmentData.appointment.startTime,
        endTime: appointmentData.appointment.endTime,
        type: formData.type,
        reason: formData.reason,
        status: appointmentData.appointment.status,
      };

      // Add success message with appointment card
      const successMessage: Message = {
        id: Date.now().toString(),
        text: 'Your appointment has been successfully booked!',
        isUser: false,
        timestamp: new Date(),
        appointmentDetails,
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Error booking appointment:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, there was an error booking your appointment. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFormCancel = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      text: 'Appointment booking cancelled. How else can I help you?',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">🏥 Hospital Reception</h1>
        <p className="text-gray-600 text-sm">AI Assistant - Powered by Groq</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-6xl mb-4">🏥</div>
            <p className="text-lg">Hello! I&apos;m your hospital reception assistant. How can I help you today?</p>
            <p className="text-sm mt-2">I can help with appointments, visiting hours, insurance, and general inquiries.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id}>
            {/* Regular message */}
            <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : message.metadata?.emergency
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className={`flex justify-between items-center mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span className="text-xs">{message.timestamp.toLocaleTimeString()}</span>
                  {!message.isUser && message.confidence !== undefined && (
                    <span className="text-xs">
                      Confidence: {Math.round(message.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Show appointment form if needed */}
            {!message.isUser && message.showForm && (
              <div className="mt-4">
                <AppointmentForm 
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </div>
            )}

            {/* Show appointment card if available */}
            {!message.isUser && message.appointmentDetails && (
              <div className="mt-4">
                <AppointmentCard appointment={message.appointmentDetails} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex space-x-4">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
