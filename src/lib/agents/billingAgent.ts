import { BaseAgent, AgentContext, AgentResponse } from './baseAgent';
import { GROQ_MODELS } from '../groqClient';
import { Appointment } from '../../models/Appointment';
import { Patient } from '../../models/Patient';
import { connectDB } from '../db';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class BillingAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are a professional hospital billing AI assistant. Your role is to:

1. Provide information about insurance coverage and benefits
2. Explain billing procedures and payment options
3. Help with payment plan arrangements
4. Clarify medical costs and charges
5. Assist with insurance verification

IMPORTANT GUIDELINES:
- Be clear and transparent about costs
- Explain insurance terms in simple language
- Provide accurate billing information
- Be empathetic about financial concerns
- Direct complex cases to human billing specialists
- Never provide personal financial advice

INSURANCE PROVIDERS WE ACCEPT:
- Blue Cross Blue Shield
- Aetna
- Cigna
- UnitedHealth
- Medicare/Medicaid
- Most major PPO and HMO plans

PAYMENT OPTIONS:
- Insurance billing
- Self-pay with payment plans
- Credit/debit cards
- Cash payments
- Financial assistance programs

Remember: You are a billing assistant, not a financial advisor.`;

    super('BillingAgent', GROQ_MODELS.LLAMA3_8B, systemPrompt);
  }

  async processMessage(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      const lowerMessage = userMessage.toLowerCase();

      // Handle insurance queries
      if (this.isInsuranceQuery(lowerMessage)) {
        return await this.handleInsuranceQuery(userMessage, context);
      }

      // Handle payment queries
      if (this.isPaymentQuery(lowerMessage)) {
        return await this.handlePaymentQuery(userMessage, context);
      }

      // Handle cost queries
      if (this.isCostQuery(lowerMessage)) {
        return await this.handleCostQuery(userMessage, context);
      }

      // Handle billing statement queries
      if (this.isBillingStatementQuery(lowerMessage)) {
        return await this.handleBillingStatementQuery(userMessage, context);
      }

      // Default response
      const response = await this.generateResponse(userMessage, context);
      return {
        content: response,
        confidence: 0.7
      };

    } catch (error) {
      logger.error('Error in BillingAgent:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties with billing information. Please contact our billing department directly at (555) 123-4570.",
        confidence: 0.0
      };
    }
  }

  private isInsuranceQuery(message: string): boolean {
    const insuranceKeywords = [
      'insurance', 'coverage', 'benefits', 'copay', 'deductible',
      'out-of-pocket', 'network', 'provider', 'policy'
    ];
    return insuranceKeywords.some(keyword => message.includes(keyword));
  }

  private isPaymentQuery(message: string): boolean {
    const paymentKeywords = [
      'payment', 'pay', 'bill', 'charge', 'cost', 'price',
      'payment plan', 'installment', 'credit card', 'cash'
    ];
    return paymentKeywords.some(keyword => message.includes(keyword));
  }

  private isCostQuery(message: string): boolean {
    const costKeywords = [
      'how much', 'cost', 'price', 'charge', 'fee',
      'expensive', 'cheap', 'affordable', 'estimate'
    ];
    return costKeywords.some(keyword => message.includes(keyword));
  }

  private isBillingStatementQuery(message: string): boolean {
    const statementKeywords = [
      'statement', 'bill', 'invoice', 'receipt', 'explanation',
      'itemized', 'breakdown', 'charges'
    ];
    return statementKeywords.some(keyword => message.includes(keyword));
  }

  private async handleInsuranceQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('accept') || lowerMessage.includes('take')) {
      return {
        content: "We accept most major insurance providers including:\n\n• Blue Cross Blue Shield\n• Aetna\n• Cigna\n• UnitedHealth\n• Medicare/Medicaid\n• Most major PPO and HMO plans\n\nPlease bring your insurance card and photo ID to your appointment. We'll verify your benefits before your visit.",
        confidence: 0.9
      };
    }

    if (lowerMessage.includes('copay') || lowerMessage.includes('deductible')) {
      return {
        content: "Copays and deductibles vary based on your specific insurance plan. Here's what you should know:\n\n• Copay: Fixed amount you pay for each visit (typically $20-50)\n• Deductible: Amount you pay before insurance covers costs\n• Coinsurance: Percentage you pay after meeting deductible\n\nTo get your specific amounts, please provide your insurance information or call our billing department.",
        confidence: 0.8
      };
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('in-network')) {
      return {
        content: "We are in-network with most major insurance providers. Being in-network means:\n\n• Lower out-of-pocket costs\n• Insurance covers more of your bill\n• Predictable copays and deductibles\n\nTo verify your specific benefits, please provide your insurance information or call (555) 123-4570.",
        confidence: 0.8
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.7
    };
  }

  private async handlePaymentQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('payment plan') || lowerMessage.includes('installment')) {
      return {
        content: "We offer flexible payment plans to help manage your medical expenses:\n\n• 0% interest payment plans\n• Monthly installments available\n• Automatic payment options\n• Financial hardship assistance\n\nTo set up a payment plan, please contact our billing department at (555) 123-4570 or visit our financial services office.",
        confidence: 0.9
      };
    }

    if (lowerMessage.includes('credit card') || lowerMessage.includes('cash')) {
      return {
        content: "We accept multiple payment methods:\n\n• Credit/Debit cards (Visa, MasterCard, American Express, Discover)\n• Cash payments\n• Personal checks\n• Health Savings Account (HSA) cards\n• Flexible Spending Account (FSA) cards\n\nPayment is typically due at the time of service unless you have insurance coverage.",
        confidence: 0.9
      };
    }

    if (lowerMessage.includes('financial assistance') || lowerMessage.includes('help')) {
      return {
        content: "We offer financial assistance programs for qualifying patients:\n\n• Income-based discounts\n• Charity care programs\n• Sliding scale fees\n• Government assistance programs\n\nTo apply for financial assistance, please contact our financial services office or ask for an application at your next visit.",
        confidence: 0.8
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.7
    };
  }

  private async handleCostQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('consultation') || lowerMessage.includes('visit')) {
      return {
        content: "Our typical costs (before insurance) are:\n\n• Initial consultation: $200-300\n• Follow-up visit: $100-150\n• Emergency visit: $500-1000+\n• Specialist consultation: $250-400\n• Lab tests: $50-200\n\nActual costs depend on your insurance coverage. For an accurate estimate, please provide your insurance information.",
        confidence: 0.8
      };
    }

    if (lowerMessage.includes('estimate') || lowerMessage.includes('quote')) {
      return {
        content: "To provide an accurate cost estimate, I need:\n\n1. Your insurance information\n2. Type of service needed\n3. Any specific procedures\n\nPlease provide this information or call our billing department at (555) 123-4570 for a detailed estimate.",
        confidence: 0.8
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.7
    };
  }

  private async handleBillingStatementQuery(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('explanation') || lowerMessage.includes('breakdown')) {
      return {
        content: "I can help explain your billing statement. Common items include:\n\n• Professional fees (doctor's time)\n• Facility fees (use of hospital/clinic)\n• Lab tests and procedures\n• Medications and supplies\n• Administrative fees\n\nTo get a detailed explanation of your specific charges, please provide your account number or call our billing department.",
        confidence: 0.8
      };
    }

    if (lowerMessage.includes('dispute') || lowerMessage.includes('wrong')) {
      return {
        content: "If you believe there's an error on your bill, we're here to help:\n\n• Contact our billing department at (555) 123-4570\n• Provide your account number and specific concerns\n• We'll review your account within 5-7 business days\n• You can also request an itemized statement\n\nWe want to ensure your bill is accurate and fair.",
        confidence: 0.8
      };
    }

    const response = await this.generateResponse(userMessage, context);
    return {
      content: response,
      confidence: 0.7
    };
  }

  async getPatientBillingInfo(patientId: string): Promise<any> {
    try {
      await connectDB();
      
      const appointments = await Appointment.find({ 
        patientId,
        'billing.status': { $ne: 'paid' }
      }).sort({ appointmentDate: -1 });

      const totalOutstanding = appointments.reduce((sum, apt) => 
        sum + apt.billing.patientResponsibility, 0
      );

      return {
        outstandingAppointments: appointments.length,
        totalOutstanding,
        appointments: appointments.map(apt => ({
          appointmentId: apt.appointmentId,
          date: apt.appointmentDate,
          amount: apt.billing.patientResponsibility,
          status: apt.billing.status
        }))
      };
    } catch (error) {
      logger.error('Error getting patient billing info:', error);
      throw error;
    }
  }
}
