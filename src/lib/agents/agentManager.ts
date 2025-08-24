import { ReceptionAgent } from './ReceptionAgent';
import { NurseAgent } from './NurseAgent';
import { BillingAgent } from './BillingAgent';
import { AgentContext, AgentResponse } from './BaseAgent';

// const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class AgentManager {
  private receptionAgent: ReceptionAgent;
  private nurseAgent: NurseAgent;
  private billingAgent: BillingAgent;

  constructor() {
    this.receptionAgent = new ReceptionAgent();
    this.nurseAgent = new NurseAgent();
    this.billingAgent = new BillingAgent();
  }

  async processMessage(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Determine which agent should handle the message
      const agentType = this.determineAgent(userMessage, context);
      
      console.log(`Routing message to ${agentType} for session ${context.sessionId}`);
      logger.info(`Routing message to ${agentType} for session ${context.sessionId}`);

      let response: AgentResponse;

      switch (agentType) {
        case 'reception':
          console.log('Calling reception agent...');
          response = await this.receptionAgent.processMessage(userMessage, context);
          break;
        case 'nurse':
          console.log('Calling nurse agent...');
          response = await this.nurseAgent.processMessage(userMessage, context);
          break;
        case 'billing':
          console.log('Calling billing agent...');
          response = await this.billingAgent.processMessage(userMessage, context);
          break;
        default:
          console.log('Calling default reception agent...');
          response = await this.receptionAgent.processMessage(userMessage, context);
      }

      // Handle agent transitions
      if (response.nextAgent) {
        response = await this.handleAgentTransition(response.nextAgent, userMessage, context);
      }

      return response;

    } catch (error) {
      logger.error('Error in AgentManager:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our staff directly.",
        confidence: 0.0
      };
    }
  }

  private determineAgent(userMessage: string, context: AgentContext): string {
    const lowerMessage = userMessage.toLowerCase();

    // Check for billing-related keywords
    const billingKeywords = [
      'bill', 'payment', 'cost', 'price', 'insurance', 'coverage',
      'copay', 'deductible', 'financial', 'payment plan', 'charge'
    ];
    if (billingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'billing';
    }

    // Check for medical/symptom-related keywords
    const medicalKeywords = [
      'pain', 'hurt', 'ache', 'symptom', 'feeling', 'sick', 'ill',
      'fever', 'headache', 'nausea', 'dizzy', 'tired', 'weak',
      'swelling', 'bleeding', 'rash', 'cough', 'sore throat',
      'emergency', 'urgent', 'critical'
    ];
    if (medicalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'nurse';
    }

    // Check for appointment-related keywords
    const appointmentKeywords = [
      'appointment', 'book', 'schedule', 'reschedule', 'cancel',
      'doctor', 'visit', 'consultation', 'available time'
    ];
    if (appointmentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'reception';
    }

    // Check for general inquiry keywords
    const generalKeywords = [
      'hours', 'location', 'address', 'phone', 'contact',
      'visiting', 'policy', 'information', 'help'
    ];
    if (generalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'reception';
    }

    // Default to reception agent
    return 'reception';
  }

  private async handleAgentTransition(nextAgent: string, userMessage: string, context: AgentContext): Promise<AgentResponse> {
    logger.info(`Transitioning from ${context.userRole} to ${nextAgent} for session ${context.sessionId}`);

    switch (nextAgent) {
      case 'NurseAgent':
        return await this.nurseAgent.processMessage(userMessage, context);
      case 'BillingAgent':
        return await this.billingAgent.processMessage(userMessage, context);
      case 'ReceptionAgent':
      default:
        return await this.receptionAgent.processMessage(userMessage, context);
    }
  }

  async getAgentCapabilities(): Promise<{
    reception: string[];
    nurse: string[];
    billing: string[];
  }> {
    return {
      reception: [
        'Appointment booking, rescheduling, and cancellation',
        'Doctor availability lookup',
        'General hospital information and FAQs',
        'Department referrals',
        'Visiting hours and contact information'
      ],
      nurse: [
        'Symptom assessment and triage',
        'Patient intake and registration',
        'Emergency situation detection',
        'Department recommendations',
        'Basic health guidance (not medical advice)'
      ],
      billing: [
        'Insurance information and verification',
        'Cost estimates and billing explanations',
        'Payment plan arrangements',
        'Billing statement assistance',
        'Financial assistance programs'
      ]
    };
  }

  async escalateToHuman(context: AgentContext, reason: string, priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium'): Promise<void> {
    logger.info(`Escalating session ${context.sessionId} to human staff. Reason: ${reason}, Priority: ${priority}`);
    
    // In a real implementation, this would:
    // 1. Create an escalation ticket
    // 2. Notify available staff
    // 3. Update the chat session status
    // 4. Potentially send notifications via email/SMS
    
    // For now, we'll just log the escalation
    logger.info(`Human escalation requested for session ${context.sessionId}`);
  }
}
