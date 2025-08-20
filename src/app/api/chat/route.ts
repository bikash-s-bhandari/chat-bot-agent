import { NextRequest, NextResponse } from 'next/server';
import { ReceptionAgent } from '@/lib/agents/ReceptionAgent';

const receptionAgent = new ReceptionAgent();

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const agentResponse = await receptionAgent.processMessage(message, context || {});

    return NextResponse.json({ 
      response: agentResponse.content,
      confidence: agentResponse.confidence,
      nextAgent: agentResponse.nextAgent,
      metadata: agentResponse.metadata
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
