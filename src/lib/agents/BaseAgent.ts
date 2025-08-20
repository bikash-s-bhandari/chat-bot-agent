import Groq from 'groq-sdk';

export const GROQ_MODELS = {
  LLAMA3_8B: 'llama3-8b-8192',
  LLAMA3_70B: 'llama3-70b-8192',
  GEMMA2_9B: 'gemma2-9b-it',
  MIXTRAL_8X7B: 'llama3-8b-8192', // Fallback to Llama3 since Mixtral is decommissioned
} as const;

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  previousMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  confidence: number;
  nextAgent?: string;
  metadata?: Record<string, unknown>;
}

export abstract class BaseAgent {
  protected name: string;
  protected model: string;
  protected systemPrompt: string;
  protected groq: Groq;

  constructor(name: string, model: string, systemPrompt: string) {
    this.name = name;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  abstract processMessage(userMessage: string, context: AgentContext): Promise<AgentResponse>;

  protected async generateResponse(userMessage: string, context: AgentContext): Promise<string> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: this.systemPrompt,
        },
        ...(context.previousMessages || []),
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature: 0.7,
        max_completion_tokens: 1024,
        
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error(`Error generating response in ${this.name}:`, error);
      throw error;
    }
  }

  protected async shouldEscalate(context: AgentContext, userMessage: string): Promise<boolean> {
    const emergencyKeywords = [
      'emergency', 'urgent', 'critical', 'chest pain', 'heart attack',
      'stroke', 'bleeding', 'unconscious', 'not breathing', 'severe pain',
      'accident', 'trauma', '911', 'ambulance'
    ];

    const lowerMessage = userMessage.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  protected createEscalationResponse(): AgentResponse {
    return {
      content: "🚨 EMERGENCY: I've detected that you may be experiencing a medical emergency. Please:\n\n1. Call 911 immediately if this is life-threatening\n2. Go to the nearest emergency room\n3. Call our emergency line at (555) 123-4568\n\nI'm connecting you to our emergency staff right now. Please stay on the line.",
      confidence: 1.0,
      nextAgent: 'EmergencyAgent',
      metadata: { emergency: true }
    };
  }

  protected createErrorResponse(error: unknown): AgentResponse {
    console.error(`Error in ${this.name}:`, error);
    return {
      content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our staff directly.",
      confidence: 0.0
    };
  }
}
