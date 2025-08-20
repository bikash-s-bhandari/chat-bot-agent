import { BaseAgent, GROQ_MODELS, AgentContext, AgentResponse } from './BaseAgent';

export class ReceptionAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are a professional hospital reception AI assistant. Your role is to:

1. Help patients book, reschedule, or cancel appointments
2. Provide information about visiting hours, insurance, and billing
3. Answer general FAQs about hospital services
4. Direct patients to appropriate departments
5. Handle appointment inquiries professionally and empathetically

Key guidelines:
- Always be polite, professional, and empathetic
- Never provide medical advice or diagnosis
- For medical concerns, direct to appropriate departments
- For emergencies, immediately escalate to human staff
- Provide clear, actionable information
- Ask for clarification when needed

Available departments: Emergency, Cardiology, Neurology, Orthopedics, Pediatrics, Obstetrics, General Medicine, Radiology, Laboratory, Pharmacy

Visiting hours: 8:00 AM - 8:00 PM daily
Emergency services: 24/7

Insurance information: We accept most major insurance providers. Please have your insurance card ready when visiting.`;

    super('ReceptionAgent', GROQ_MODELS.LLAMA3_8B, systemPrompt);
  }

  async processMessage(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Check for escalation first
      if (await this.shouldEscalate(context, userMessage)) {
        return this.createEscalationResponse();
      }

      const lowerMessage = userMessage.toLowerCase();

      // Handle appointment-related queries
      if (this.isAppointmentQuery(lowerMessage)) {
        return await this.handleAppointmentQuery(userMessage, context);
      }

      // Handle doctor availability queries
      if (this.isDoctorAvailabilityQuery(lowerMessage)) {
        return await this.handleDoctorAvailabilityQuery(userMessage, context);
      }

      // Handle FAQ queries
      if (this.isFAQQuery(lowerMessage)) {
        return await this.handleFAQQuery(userMessage, context);
      }

      // Handle billing and insurance queries
      if (this.isBillingQuery(lowerMessage)) {
        return await this.handleBillingQuery(userMessage, context);
      }

      // Default response for general inquiries
      try {
        const response = await this.generateResponse(userMessage, context);
        return {
          content: response,
          confidence: 0.8
        };
      } catch (error) {
        console.log('Error in generateResponse:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error in ReceptionAgent:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our staff directly.",
        confidence: 0.0
      };
    }
  }

  private isAppointmentQuery(message: string): boolean {
    const appointmentKeywords = [
      'appointment', 'book', 'schedule', 'reschedule', 'cancel', 'change',
      'available time', 'slot', 'booking', 'reservation'
    ];
    return appointmentKeywords.some(keyword => message.includes(keyword));
  }

  private isDoctorAvailabilityQuery(message: string): boolean {
    const availabilityKeywords = [
      'doctor available', 'when is', 'availability', 'schedule', 'working hours',
      'next available', 'open slots'
    ];
    return availabilityKeywords.some(keyword => message.includes(keyword));
  }

  private isFAQQuery(message: string): boolean {
    const faqKeywords = [
      'visiting hours', 'open', 'close', 'hours', 'location', 'address',
      'phone number', 'contact', 'parking', 'visitor', 'policy'
    ];
    return faqKeywords.some(keyword => message.includes(keyword));
  }

  private isBillingQuery(message: string): boolean {
    const billingKeywords = [
      'bill', 'payment', 'cost', 'price', 'insurance', 'coverage',
      'copay', 'deductible', 'financial', 'payment plan'
    ];
    return billingKeywords.some(keyword => message.includes(keyword));
  }

  private async handleAppointmentQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return {
        content: "I'd be happy to help you book an appointment. To get started, I'll need some information:\n\n1. What type of appointment do you need? (consultation, follow-up, routine check-up, etc.)\n2. Do you have a preferred doctor or department?\n3. What's your preferred date and time?\n4. What's the reason for your visit?\n\nPlease provide these details so I can assist you better.",
        confidence: 0.9,
        nextAgent: 'NurseAgent' // For symptom assessment
      };
    }

    if (lowerMessage.includes('reschedule') || lowerMessage.includes('change')) {
      return {
        content: "I can help you reschedule your appointment. Please provide:\n\n1. Your current appointment ID or date/time\n2. Your preferred new date and time\n3. The reason for rescheduling\n\nI'll check availability and make the changes for you.",
        confidence: 0.9
      };
    }

    if (lowerMessage.includes('cancel')) {
      return {
        content: "I understand you need to cancel your appointment. Please provide:\n\n1. Your appointment ID or date/time\n2. The reason for cancellation\n\nI'll process the cancellation for you. Please note that we have a 24-hour cancellation policy.",
        confidence: 0.9
      };
    }

    // Default appointment response
    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8
    };
  }

  private async handleDoctorAvailabilityQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract department or doctor name from message
      const departments = ['emergency', 'cardiology', 'neurology', 'orthopedics', 'pediatrics', 'obstetrics', 'general'];
      const mentionedDepartment = departments.find(dept => userMessage.toLowerCase().includes(dept));
      
      if (mentionedDepartment) {
        // Mock doctor data for now
        const mockDoctors = [
          { firstName: 'John', lastName: 'Smith', specialization: 'Cardiology' },
          { firstName: 'Sarah', lastName: 'Johnson', specialization: 'Neurology' },
          { firstName: 'Michael', lastName: 'Brown', specialization: 'Orthopedics' }
        ];

        const doctorList = mockDoctors.map(doc => 
          `- Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization})`
        ).join('\n');

        return {
          content: `Here are the available doctors in ${mentionedDepartment}:\n\n${doctorList}\n\nWould you like to book an appointment with any of these doctors?`,
          confidence: 0.9
        };
      }

      const response = await this.generateResponse(userMessage, context);
      return {
        content: response,
        confidence: 0.8
      };
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      return {
        content: "I'm having trouble accessing the doctor schedule right now. Please try again or contact our staff directly.",
        confidence: 0.3
      };
    }
  }

  private async handleFAQQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('visiting hours') || lowerMessage.includes('hours')) {
      return {
        content: "Our visiting hours are:\n\n• Monday - Friday: 8:00 AM - 8:00 PM\n• Saturday - Sunday: 8:00 AM - 6:00 PM\n• Emergency Department: 24/7\n\nPlease note that some departments may have specific visiting hours. Would you like information about a particular department?",
        confidence: 1.0
      };
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
      return {
        content: "We are located at:\n\n123 Healthcare Avenue\nMedical District, CA 90210\n\nParking is available in our main lot, and we're easily accessible by public transportation. Would you like directions or parking information?",
        confidence: 1.0
      };
    }

    if (lowerMessage.includes('phone') || lowerMessage.includes('contact')) {
      return {
        content: "You can reach us at:\n\n• Main Reception: (555) 123-4567\n• Emergency: (555) 123-4568\n• Appointment Line: (555) 123-4569\n• Billing: (555) 123-4570\n\nOur lines are open during visiting hours. For emergencies, call 911 or our emergency line.",
        confidence: 1.0
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8
    };
  }

  private async handleBillingQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('insurance')) {
      return {
        content: "We accept most major insurance providers including:\n\n• Blue Cross Blue Shield\n• Aetna\n• Cigna\n• UnitedHealth\n• Medicare/Medicaid\n\nPlease bring your insurance card and ID to your appointment. For specific coverage questions, contact our billing department at (555) 123-4570.",
        confidence: 0.9
      };
    }

    if (lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return {
        content: "Our costs vary based on the type of service and your insurance coverage. Typical costs include:\n\n• Consultation: $150-300\n• Follow-up: $100-200\n• Emergency visit: $500-1000+\n• Lab tests: $50-200\n\nFor an accurate estimate, please provide your insurance information or contact our billing department.",
        confidence: 0.8
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8
    };
  }
}
