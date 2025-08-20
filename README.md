# AI Chatbot with Groq

A simple chatbot application built with Next.js and powered by the Groq API. This project provides a modern, responsive chat interface for interacting with AI models.

## Features

- 🤖 Real-time chat interface with AI
- 💬 Modern, responsive UI with Tailwind CSS
- ⚡ Fast responses powered by Groq's LLM models
- 📱 Mobile-friendly design
- 🔄 Loading states and error handling

## Prerequisites

Before running this project, you'll need:

1. A Groq API key - Get one from [Groq Console](https://console.groq.com/)
2. Node.js 18+ installed on your system

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Groq API key:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the chatbot in action.

## Usage

- Type your message in the input field at the bottom
- Press Enter or click the Send button to send your message
- The AI will respond using Groq's Llama3-8b model
- Messages are displayed in a chat-like interface with timestamps

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
