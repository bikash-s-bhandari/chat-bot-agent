import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';

import { Patient } from '../../models/Patient';
import { connectDB } from '../../lib/db/db';




export class NurseAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are a professional nurse AI assistant specializing in patient triage and symptom assessment. Your role is to:

1. Collect and assess patient symptoms
2. Determine appropriate triage level (low, medium, high, emergency)
3. Suggest appropriate departments for care
4. Gather patient intake information
5. Provide basic health guidance (NOT medical advice)

IMPORTANT GUIDELINES:
- NEVER provide medical diagnosis or treatment recommendations
- ALWAYS escalate emergency situations immediately
- Focus on symptom collection and triage assessment
- Be empathetic and professional
- Ask clarifying questions when needed
- Direct patients to appropriate departments

TRIAGE LEVELS:
- LOW: Minor symptoms, can wait for regular appointment
- MEDIUM: Moderate symptoms, should be seen within 24-48 hours
- HIGH: Serious symptoms, should be seen within 2-6 hours
- EMERGENCY: Critical symptoms, immediate medical attention required

DEPARTMENT MAPPING:
- Chest pain, heart issues → Cardiology
- Head injuries, neurological symptoms → Neurology
- Broken bones, joint pain → Orthopedics
- Children under 18 → Pediatrics
- Pregnancy-related → Obstetrics
- General symptoms → General Medicine
- Critical/emergency → Emergency Department

Remember: You are NOT a doctor. You are a triage nurse assistant.`;

    //super('NurseAgent', GROQ_MODELS.LLAMA3_8B, systemPrompt);
  }

  async processMessage(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Check for escalation first
      if (await this.shouldEscalate(context, userMessage)) {
        return this.createEscalationResponse();
      }

      const lowerMessage = userMessage.toLowerCase();

      // Handle symptom assessment
      if (this.isSymptomQuery(lowerMessage)) {
        return await this.handleSymptomAssessment(userMessage, context);
      }

      // Handle patient intake
      if (this.isIntakeQuery(lowerMessage)) {
        return await this.handlePatientIntake(userMessage, context);
      }

      // Handle triage level assessment
      if (this.isTriageQuery(lowerMessage)) {
        return await this.handleTriageAssessment(userMessage, context);
      }

      // Default response
      const response = await this.generateResponse(userMessage, context);
      return {
        content: response,
        confidence: 0.7
      };

    } catch (error) {
      logger.error('Error in NurseAgent:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our nursing staff directly.",
        confidence: 0.0
      };
    }
  }

  private isSymptomQuery(message: string): boolean {
    const symptomKeywords = [
      'pain', 'hurt', 'ache', 'symptom', 'feeling', 'sick', 'ill',
      'fever', 'headache', 'nausea', 'dizzy', 'tired', 'weak',
      'swelling', 'bleeding', 'rash', 'cough', 'sore throat'
    ];
    return symptomKeywords.some(keyword => message.includes(keyword));
  }

  private isIntakeQuery(message: string): boolean {
    const intakeKeywords = [
      'first time', 'new patient', 'register', 'information',
      'personal details', 'contact', 'emergency contact'
    ];
    return intakeKeywords.some(keyword => message.includes(keyword));
  }

  private isTriageQuery(message: string): boolean {
    const triageKeywords = [
      'how urgent', 'how serious', 'when should', 'priority',
      'emergency', 'urgent', 'immediate'
    ];
    return triageKeywords.some(keyword => message.includes(keyword));
  }

  private async handleSymptomAssessment(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency symptoms that require immediate escalation
    const emergencySymptoms = [
      'chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding',
      'head injury', 'stroke symptoms', 'heart attack', 'seizure'
    ];

    if (emergencySymptoms.some(symptom => lowerMessage.includes(symptom))) {
      return {
        content: "This sounds like a medical emergency. I'm immediately connecting you to our emergency department. Please stay on the line and don't hang up.",
        actions: [{
          type: 'escalate_to_human',
          data: { priority: 'emergency', reason: 'emergency_symptoms' }
        }],
        confidence: 1.0
      };
    }

    // High priority symptoms
    const highPrioritySymptoms = [
      'severe pain', 'high fever', 'broken bone', 'deep cut',
      'sudden vision loss', 'severe headache'
    ];

    if (highPrioritySymptoms.some(symptom => lowerMessage.includes(symptom))) {
      return {
        content: "These symptoms require prompt medical attention. I recommend you visit our emergency department or urgent care within the next 2-4 hours. Would you like me to help you schedule an urgent appointment?",
        confidence: 0.9,
        nextAgent: 'ReceptionAgent'
      };
    }

    // Medium priority symptoms
    const mediumPrioritySymptoms = [
      'persistent cough', 'mild fever', 'minor injury', 'chronic pain',
      'digestive issues', 'skin rash'
    ];

    if (mediumPrioritySymptoms.some(symptom => lowerMessage.includes(symptom))) {
      return {
        content: "These symptoms should be evaluated by a healthcare provider within 24-48 hours. I can help you schedule an appointment with an appropriate specialist. Would you like me to connect you to our reception to book an appointment?",
        confidence: 0.8,
        nextAgent: 'ReceptionAgent'
      };
    }

    // Low priority symptoms
    return {
      content: "I understand you're experiencing symptoms. To better assist you, I need to gather some information:\n\n1. How long have you been experiencing these symptoms?\n2. How severe would you rate them on a scale of 1-10?\n3. Have you experienced similar symptoms before?\n4. Are you currently taking any medications?\n\nThis will help me determine the best course of action for your care.",
      confidence: 0.7
    };
  }

  private async handlePatientIntake(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    return {
      content: "I'll help you with the patient intake process. I need to collect some basic information:\n\n1. Full name (first and last)\n2. Date of birth\n3. Contact information (phone and email)\n4. Emergency contact name and phone number\n5. Insurance information (if available)\n6. Any known allergies or current medications\n\nPlease provide this information so I can help you get registered in our system.",
      confidence: 0.9,
      actions: [{
        type: 'update_patient',
        data: { status: 'intake_in_progress' }
      }]
    };
  }

  private async handleTriageAssessment(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Determine triage level based on symptoms
    let triageLevel = 'low';
    let department = 'General Medicine';
    let urgency = 'You can schedule a regular appointment.';

    if (lowerMessage.includes('chest') || lowerMessage.includes('heart')) {
      triageLevel = 'high';
      department = 'Cardiology';
      urgency = 'This requires prompt evaluation. Please schedule within 24 hours.';
    } else if (lowerMessage.includes('head') || lowerMessage.includes('brain') || lowerMessage.includes('neurological')) {
      triageLevel = 'high';
      department = 'Neurology';
      urgency = 'This requires prompt evaluation. Please schedule within 24 hours.';
    } else if (lowerMessage.includes('bone') || lowerMessage.includes('joint') || lowerMessage.includes('fracture')) {
      triageLevel = 'medium';
      department = 'Orthopedics';
      urgency = 'This should be evaluated within 48 hours.';
    } else if (lowerMessage.includes('child') || lowerMessage.includes('pediatric')) {
      triageLevel = 'medium';
      department = 'Pediatrics';
      urgency = 'Children should be evaluated promptly. Please schedule within 24-48 hours.';
    }

    return {
      content: `Based on your symptoms, I've assessed your triage level as ${triageLevel.toUpperCase()} priority. ${urgency}\n\nI recommend you see our ${department} department. Would you like me to help you schedule an appointment?`,
      confidence: 0.8,
      nextAgent: 'ReceptionAgent',
      actions: [{
        type: 'update_patient',
        data: { 
          triageLevel,
          assignedDepartment: department
        }
      }]
    };
  }

  async updatePatientTriage(patientId: string, triageLevel: string, department: string): Promise<void> {
    try {
      await connectDB();
      await Patient.findByIdAndUpdate(patientId, {
        triageLevel,
        assignedDepartment: department
      });
      logger.info(`Updated triage for patient ${patientId}: ${triageLevel} -> ${department}`);
    } catch (error) {
      logger.error('Error updating patient triage:', error);
      throw error;
    }
  }
}
