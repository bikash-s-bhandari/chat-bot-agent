import {
  BaseAgent,
  GROQ_MODELS,
  AgentContext,
  AgentResponse,
} from "./BaseAgent";
import connectDB from '../database';
import { Doctor, IDoctor } from '../../models/Doctor';
import { Patient, IPatient } from '../../models/Patient';
import { Appointment, IAppointment } from '../../models/Appointment';
import { FilterQuery } from 'mongoose';

type BookingDetails = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentDate?: string;
  startTime?: string;
  type?: string;
  reason?: string;
};

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
          "I'd be happy to help you book an appointment! Please fill out the form below with your information and appointment details.",
        confidence: 0.9,
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
       const doctorMatch = lowerMessage.match(/dr\.?\s+([a-zA-Z\s]+)/);
       let doctorName: string | null = null;
       
       if (doctorMatch && doctorMatch[1]) {
         doctorName = doctorMatch[1].trim();
       } else if (lowerMessage.includes("his") || lowerMessage.includes("her")) {
         const previousMessage = context.previousMessages?.slice(-2).find(msg => msg.content.includes("Dr."));
         if (previousMessage) {
           const match = previousMessage.content.match(/Dr\.?\s+([a-zA-Z\s]+)/);
           doctorName = match ? match[1].trim() : null;
         }
       }

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
              .filter((slot: IDoctor['availability'][number]) => slot.isAvailable)
              .map((slot: IDoctor['availability'][number]) => {
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

  private normalizeTimeTo24Hour(timeInput: string): string | null {
    const trimmed = timeInput.trim();
    const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
    if (twelveHourMatch) {
      let hours = parseInt(twelveHourMatch[1], 10);
      const minutes = twelveHourMatch[2];
      const period = twelveHourMatch[3].toLowerCase();
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      const hh = hours.toString().padStart(2, '0');
      return `${hh}:${minutes}`;
    }
    const twentyFourHourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    return twentyFourHourMatch ? trimmed : null;
  }

  private parseKeyValue(message: string, key: string): string | null {
    const regex = new RegExp(`${key}\\s*[:=-]\\s*(.+)`, 'i');
    const match = message.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractBookingDetails(message: string): BookingDetails {
    const details: BookingDetails = {};

    const firstName = this.parseKeyValue(message, 'first name') || this.parseKeyValue(message, 'firstname');
    if (firstName) details.firstName = firstName;
    const lastName = this.parseKeyValue(message, 'last name') || this.parseKeyValue(message, 'lastname');
    if (lastName) details.lastName = lastName;
    const dob = this.parseKeyValue(message, 'date of birth') || this.parseKeyValue(message, 'dob');
    if (dob) details.dateOfBirth = dob;
    const gender = this.parseKeyValue(message, 'gender');
    if (gender) details.gender = gender;
    const email = this.parseKeyValue(message, 'email');
    if (email) details.email = email;
    const phone = this.parseKeyValue(message, 'phone');
    if (phone) details.phone = phone;
    const address = this.parseKeyValue(message, 'address');
    if (address) details.address = address;
    const typeVal = this.parseKeyValue(message, 'type');
    if (typeVal) details.type = typeVal;
    const reason = this.parseKeyValue(message, 'reason') || this.parseKeyValue(message, 'note');
    if (reason) details.reason = reason;

    const doctorId = this.parseKeyValue(message, 'doctorid') || this.parseKeyValue(message, 'doctor id');
    if (doctorId) details.doctorId = doctorId;

    const doctorMatch = message.match(/dr\.?\s+([a-zA-Z]+)\s+([a-zA-Z]+)/i);
    if (doctorMatch) {
      details.doctorName = `${doctorMatch[1]} ${doctorMatch[2]}`;
    }

    const dateVal = this.parseKeyValue(message, 'date') || this.parseKeyValue(message, 'appointment date');
    if (dateVal) details.appointmentDate = dateVal;

    const timeVal = this.parseKeyValue(message, 'time') || this.parseKeyValue(message, 'start time');
    if (timeVal) details.startTime = timeVal;

    // Fallback email/phone extraction from free text
    if (!details.email) {
      const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch) details.email = emailMatch[0];
    }
    if (!details.phone) {
      const phoneMatch = message.replace(/[^0-9]/g, ' ').match(/\b(\d{10,15})\b/);
      if (phoneMatch) details.phone = phoneMatch[1];
    }

    return details;
  }

  private async tryBookAppointmentFromMessage(userMessage: string): Promise<AgentResponse | null> {
    try {
      await connectDB();
      const raw = userMessage;
      const details = this.extractBookingDetails(raw);

      const missing: string[] = [];
      const required: Array<[keyof typeof details, string]> = [
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['dateOfBirth', 'Date of birth (YYYY-MM-DD)'],
        ['gender', 'Gender'],
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['address', 'Address'],
        ['appointmentDate', 'Date (YYYY-MM-DD)'],
        ['startTime', 'Time (HH:MM)'],
        ['type', 'Type'],
        ['reason', 'Reason'],
      ];

      for (const [key, label] of required) {
        if (!details[key]) missing.push(label);
      }
      if (!details.doctorId && !details.doctorName) missing.push('Doctor (Dr. First Last or doctorId)');

      if (missing.length > 0) {
        return null;
      }

      const normalizedTime = this.normalizeTimeTo24Hour(details.startTime!);
      if (!normalizedTime) {
        return {
          content: 'Please provide time in HH:MM (24h) or HH:MM am/pm format.',
          confidence: 0.8,
        };
      }

      const appointmentDate = new Date(details.appointmentDate!);
      if (isNaN(appointmentDate.getTime())) {
        return {
          content: 'Please provide a valid date in YYYY-MM-DD format.',
          confidence: 0.8,
        };
      }

      // Resolve doctor
      let doctor: IDoctor | null = null;
      if (details.doctorId) {
        doctor = await Doctor.findOne({ doctorId: details.doctorId, isActive: true });
      } else if (details.doctorName) {
        const [firstName, lastName] = details.doctorName.split(/\s+/).filter(Boolean);
        const query: FilterQuery<IDoctor> = lastName
          ? { firstName: new RegExp(`^${firstName}$`, 'i'), lastName: new RegExp(`^${lastName}$`, 'i'), isActive: true }
          : { firstName: new RegExp(`^${firstName}$`, 'i'), isActive: true };
        doctor = await Doctor.findOne(query);
      }

      if (!doctor) {
        return {
          content: 'I could not find the specified doctor. Please provide a valid doctorId or full name (e.g., Dr. Jane Doe).',
          confidence: 0.7,
        };
      }

      // Check availability
      const dayOfWeek = appointmentDate.getDay();
      const slot = doctor.availability?.find((s: IDoctor['availability'][number]) => s.dayOfWeek === dayOfWeek && s.isAvailable && s.startTime <= normalizedTime && s.endTime > normalizedTime);
      if (!slot) {
        return {
          content: 'The doctor is not available at the requested time. Please choose another time.',
          confidence: 0.8,
        };
      }

      // Conflict check
      const conflict = await Appointment.findOne({
        doctorId: doctor.doctorId,
        appointmentDate,
        startTime: normalizedTime,
        status: { $in: ['scheduled', 'confirmed'] },
      });
      if (conflict) {
        return {
          content: 'This time slot is already booked. Please choose another time.',
          confidence: 0.9,
        };
      }

      // Ensure patient exists or create
      let patientDoc: IPatient;
      const foundPatient = await Patient.findOne({ email: (details.email as string).toLowerCase() });
      if (foundPatient) {
        patientDoc = foundPatient;
      } else {
        const createdPatient = new Patient({
          firstName: details.firstName,
          lastName: details.lastName,
          dateOfBirth: new Date(details.dateOfBirth!),
          gender: details.gender,
          email: (details.email as string).toLowerCase(),
          phone: details.phone,
          address: details.address,
          symptoms: [],
        });
        await createdPatient.save();
        patientDoc = createdPatient;
      }

      // Create appointment
      const appointment: IAppointment = new Appointment({
        patientId: patientDoc.patientId,
        doctorId: doctor.doctorId,
        appointmentDate,
        startTime: normalizedTime,
        type: (details.type as IAppointment['type']) || 'consultation',
        reason: details.reason,
        status: 'scheduled',
      });
      await appointment.save();

      return {
        content: `Your appointment is booked.\n\nAppointment ID: ${appointment.appointmentId}\nPatient: ${patientDoc.firstName} ${patientDoc.lastName} (${patientDoc.patientId})\nDoctor: Dr. ${doctor.firstName} ${doctor.lastName}\nDate: ${appointmentDate.toISOString().slice(0,10)}\nTime: ${appointment.startTime}-${appointment.endTime}\nType: ${appointment.type}\nReason: ${appointment.reason}`,
        confidence: 1.0,
      };
    } catch (error) {
      console.error('Error booking appointment from message:', error);
      return {
        content: 'I could not complete the booking due to an internal error. Please try again shortly.',
        confidence: 0.2,
      };
    }
  }
}