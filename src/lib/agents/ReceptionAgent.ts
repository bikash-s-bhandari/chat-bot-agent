import {
  BaseAgent,
  GROQ_MODELS,
  AgentContext,
  AgentResponse,
} from "./BaseAgent";
import connectDB from '../database';
import { Doctor } from '../../models/Doctor';

export class ReceptionAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are a professional hospital reception AI assistant. Your role is to:

1. Help patients book, reschedule, or cancel appointments
2. Provide information about visiting hours, insurance, and billing
3. Answer general FAQs about hospital services
4. Direct patients to appropriate departments
5. Handle appointment inquiries professionally and empathetically
6. If the query is unrelated to hospital services, politely say: "I can only help with hospital-related questions."

Key guidelines:
- Always be polite, professional, and empathetic
- Never provide medical advice or diagnosis
- For medical concerns, direct to appropriate departments
- For emergencies, immediately escalate to human staff
- Provide clear, actionable information
- Ask for clarification when needed
- For doctor availability queries, only provide information based on actual database data. Do not invent doctor names or details.
- Respond to greetings like "hi" or "hello" with a friendly, conversational response without prompting for specific information unless explicitly asked.

Available departments: Emergency, Cardiology, Neurology, Orthopedics, Pediatrics, Obstetrics, General Medicine, Radiology, Laboratory, Pharmacy

Visiting hours: 8:00 AM - 8:00 PM daily
Emergency services: 24/7

Insurance information: We accept most major insurance providers. Please have your insurance card ready when visiting.`;

    super("ReceptionAgent", GROQ_MODELS.LLAMA3_8B, systemPrompt);
  }

  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Check for escalation first
      if (await this.shouldEscalate(context, userMessage)) {
        return this.createEscalationResponse();
      }

      const lowerMessage = userMessage.toLowerCase();

      // Handle greetings
      if (this.isGreeting(lowerMessage)) {
        return {
          content: "Hello! I'm here to assist you with hospital services, appointments, or any questions you have. Just let me know how I can help!",
          confidence: 0.9,
        };
      }

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

      // Default response for unrecognized queries
      return {
        content: "I'm not sure what you mean. Could you please provide more details or ask about appointments, doctors, visiting hours, or billing?",
        confidence: 0.5,
      };
    } catch (error) {
      console.error("Error in ReceptionAgent:", error);
      return {
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again or contact our staff directly.",
        confidence: 0.0,
      };
    }
  }

  private isGreeting(message: string): boolean {
    const greetingKeywords = [
      "hi",
      "hello",
      "hey",
      "greetings",
      "good morning",
      "good afternoon",
      "good evening",
    ];
    return greetingKeywords.some((keyword) => message.includes(keyword));
  }

  private isAppointmentQuery(message: string): boolean {
    const appointmentKeywords = [
      "appointment",
      "book",
      "schedule",
      "reschedule",
      "cancel",
      "change",
      "available time",
      "slot",
      "booking",
      "reservation",
    ];
    return appointmentKeywords.some((keyword) => message.includes(keyword));
  }

  private isDoctorAvailabilityQuery(message: string): boolean {
    const availabilityKeywords = [
      "doctor available",
      "doctors available",
      "available doctor",
      "available doctors",
      "when is",
      "availability",
      "schedule",
      "working hours",
      "next available",
      "open slots",
      "who is",
      "which doctor",
      "which doctors",
      "what doctors",
      "available time",
      "his available",
      "her available",
      "their available",
    ];
    return availabilityKeywords.some((keyword) => message.includes(keyword));
  }

  private isFAQQuery(message: string): boolean {
    const faqKeywords = [
      "visiting hours",
      "open",
      "close",
      "hours",
      "location",
      "address",
      "phone number",
      "contact",
      "parking",
      "visitor",
      "policy",
    ];
    return faqKeywords.some((keyword) => message.includes(keyword));
  }

  private isBillingQuery(message: string): boolean {
    const billingKeywords = [
      "bill",
      "payment",
      "cost",
      "price",
      "insurance",
      "coverage",
      "copay",
      "deductible",
      "financial",
      "payment plan",
    ];
    return billingKeywords.some((keyword) => message.includes(keyword));
  }

  private async handleAppointmentQuery(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("book") || lowerMessage.includes("schedule")) {
      return {
        content:
          "I'd be happy to help you book an appointment. To get started, I'll need some information:\n\n1. What type of appointment do you need? (consultation, follow-up, routine check-up, etc.)\n2. Do you have a preferred doctor or department?\n3. What's your preferred date and time?\n4. What's the reason for your visit?\n\nPlease provide these details so I can assist you better.",
        confidence: 0.9,
        nextAgent: "NurseAgent", // For symptom assessment
      };
    }

    if (
      lowerMessage.includes("reschedule") ||
      lowerMessage.includes("change")
    ) {
      return {
        content:
          "I can help you reschedule your appointment. Please provide:\n\n1. Your current appointment ID or date/time\n2. Your preferred new date and time\n3. The reason for rescheduling\n\nI'll check availability and make the changes for you.",
        confidence: 0.9,
      };
    }

    if (lowerMessage.includes("cancel")) {
      return {
        content:
          "I understand you need to cancel your appointment. Please provide:\n\n1. Your appointment ID or date/time\n2. The reason for cancellation\n\nI'll process the cancellation for you. Please note that we have a 24-hour cancellation policy.",
        confidence: 0.9,
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8,
    };
  }

  private async handleDoctorAvailabilityQuery(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      console.log("Processing doctor availability query:", userMessage);
      
      // Extract department or doctor name from message
      const departments = [
        "emergency",
        "cardiology",
        "neurology",
        "orthopedics",
        "pediatrics",
        "obstetrics",
        "general medicine",
      ];
      const lowerMessage = userMessage.toLowerCase();
      const mentionedDepartment = departments.find((dept) =>
        lowerMessage.includes(dept)
      );

      // Check for specific doctor reference (e.g., "Dr. Smith" or "his")
      const doctorMatch = lowerMessage.match(/dr\.?\s+([a-zA-Z\s]+)/) || 
                         (lowerMessage.includes("his") || lowerMessage.includes("her") ? 
                          context.previousMessages?.slice(-2).find(msg => msg.content.includes("Dr.")) : null);
      const doctorName = doctorMatch ? 
        (typeof doctorMatch === 'string' ? doctorMatch : doctorMatch[1]?.trim()) || 
        (doctorMatch?.content?.match(/Dr\.?\s+([a-zA-Z\s]+)/)?.[1]?.trim()) : null;

      console.log("Mentioned department:", mentionedDepartment);
      console.log("Mentioned doctor name:", doctorName);

      if (doctorName) {
        try {
          // Fetch specific doctor's availability
          await connectDB();
          const [firstName, lastName] = doctorName.split(/\s+/).filter(Boolean);
          const doctorQuery = lastName 
            ? { firstName: new RegExp(`^${firstName}$`, 'i'), lastName: new RegExp(`^${lastName}$`, 'i'), isActive: true }
            : { firstName: new RegExp(`^${firstName}$`, 'i'), isActive: true };
          
          console.log("Searching for doctor:", doctorQuery);
          const doctor = await Doctor.findOne(doctorQuery)
            .select('firstName lastName specialization department availability');

          console.log("Query parameters:", doctorQuery);
          console.log("Found doctor:", doctor ? JSON.stringify(doctor, null, 2) : 'None');

          if (doctor) {
            const availabilityList = doctor.availability
              .filter(slot => slot.isAvailable)
              .map(slot => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return `- ${days[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}`;
              })
              .join("\n");

            const response = availabilityList
              ? `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}, ${doctor.department}) is available at the following times:\n\n${availabilityList}\n\nWould you like to book an appointment?`
              : `Dr. ${doctor.firstName} ${doctor.lastName} has no available time slots at the moment. Would you like to check another doctor or contact our reception desk?`;

            return {
              content: response,
              confidence: 0.9,
            };
          } else {
            return {
              content: `I couldn't find a doctor named "${doctorName}" in our database. Please provide the full name or check the spelling, or ask for availability by department.`,
              confidence: 0.7,
            };
          }
        } catch (dbError) {
          console.error("Database error in doctor availability query:", dbError);
          return {
            content: "I'm having trouble accessing the doctor database right now. Please try again or contact our staff directly.",
            confidence: 0.3,
          };
        }
      }

      if (mentionedDepartment) {
        try {
          // Fetch real doctor data from database
          await connectDB();
          const departmentName = mentionedDepartment.charAt(0).toUpperCase() + mentionedDepartment.slice(1).toLowerCase();
          console.log("Searching for department:", departmentName);
          
          const doctors = await Doctor.find({ 
            department: new RegExp(`^${departmentName}$`, 'i'), // Case-insensitive match
            isActive: true 
          }).select('firstName lastName specialization experience');

          console.log("Query parameters:", { department: new RegExp(`^${departmentName}$`, 'i'), isActive: true });
          console.log("Found doctors:", doctors.length);
          console.log("Doctors data:", JSON.stringify(doctors, null, 2));

          if (doctors && doctors.length > 0) {
            const doctorList = doctors
              .map(
                (doc: { firstName: string; lastName: string; specialization: string; experience: number }) =>
                  `- Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization}) - ${doc.experience} years experience`
              )
              .join("\n");

            console.log("Generated doctor list:", doctorList);

            return {
              content: `Here are the available doctors in ${departmentName}:\n\n${doctorList}\n\nWould you like to book an appointment with any of these doctors?`,
              confidence: 0.9,
            };
          } else {
            console.log("No doctors found for department:", departmentName);
            return {
              content: `I don't see any available doctors in the ${departmentName} department at the moment. Would you like to check another department or contact our reception desk for assistance?`,
              confidence: 0.7,
            };
          }
        } catch (dbError) {
          console.error("Database error in doctor availability query:", dbError);
          return {
            content: "I'm having trouble accessing the doctor database right now. Please try again or contact our staff directly.",
            confidence: 0.3,
          };
        }
      }

      // Handle queries without specific department or doctor
      console.log("No specific department or doctor mentioned, fetching all doctors");
      await connectDB();
      const allDoctors = await Doctor.find({ isActive: true })
        .select('firstName lastName specialization department experience')
        .sort({ department: 1, firstName: 1 });

      if (allDoctors && allDoctors.length > 0) {
        const doctorList = allDoctors
          .map(
            (doc: { firstName: string; lastName: string; department: string; experience: number }) =>
              `- Dr. ${doc.firstName} ${doc.lastName} (${doc.department}) - ${doc.experience} years experience`
          )
          .join("\n");

        return {
          content: `Here are all our available doctors:\n\n${doctorList}\n\nPlease specify a doctor's name or department to check their availability.`,
          confidence: 0.8,
        };
      }

      return {
        content: "I couldn't find any available doctors at the moment. Please specify a doctor's name or department, or contact our staff directly.",
        confidence: 0.3,
      };
    } catch (error) {
      console.error("Error checking doctor availability:", error);
      return {
        content: "I'm having trouble accessing the doctor schedule right now. Please try again or contact our staff directly.",
        confidence: 0.3,
      };
    }
  }

  private async handleFAQQuery(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes("visiting hours") ||
      lowerMessage.includes("hours")
    ) {
      return {
        content:
          "Our visiting hours are:\n\n• Monday - Friday: 8:00 AM - 8:00 PM\n• Saturday - Sunday: 8:00 AM - 6:00 PM\n• Emergency Department: 24/7\n\nPlease note that some departments may have specific visiting hours. Would you like information about a particular department?",
        confidence: 1.0,
      };
    }

    if (lowerMessage.includes("location") || lowerMessage.includes("address")) {
      return {
        content:
          "We are located at:\n\n123 Healthcare Avenue\nMedical District, CA 90210\n\nParking is available in our main lot, and we're easily accessible by public transportation. Would you like directions or parking information?",
        confidence: 1.0,
      };
    }

    if (lowerMessage.includes("phone") || lowerMessage.includes("contact")) {
      return {
        content:
          "You can reach us at:\n\n• Main Reception: (555) 123-4567\n• Emergency: (555) 123-4568\n• Appointment Line: (555) 123-4569\n• Billing: (555) 123-4570\n\nOur lines are open during visiting hours. For emergencies, call 911 or our emergency line.",
        confidence: 1.0,
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8,
    };
  }

  private async handleBillingQuery(
    userMessage: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("insurance")) {
      return {
        content:
          "We accept most major insurance providers including:\n\n• Blue Cross Blue Shield\n• Aetna\n• Cigna\n• UnitedHealth\n• Medicare/Medicaid\n\nPlease bring your insurance card and ID to your appointment. For specific coverage questions, contact our billing department at (555) 123-4570.",
        confidence: 0.9,
      };
    }

    if (lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      return {
        content:
          "Our costs vary based on the type of service and your insurance coverage. Typical costs include:\n\n• Consultation: $150-300\n• Follow-up: $100-200\n• Emergency visit: $500-1000+\n• Lab tests: $50-200\n\nFor an accurate estimate, please provide your insurance information or contact our billing department.",
        confidence: 0.8,
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.8,
    };
  }
}