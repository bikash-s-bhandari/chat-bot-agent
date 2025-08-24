import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-chatbot';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

declare global {
  var mongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined;
}

let cached = global.mongoose as { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined;

if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

async function connectDB() {
  const state = cached as { conn: Mongoose | null; promise: Promise<Mongoose> | null };
  if (state.conn) {
    return state.conn;
  }

  if (!state.promise) {
    const opts = {
      bufferCommands: false,
    };

    state.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB successfully');
      return mongoose;
    });
  }

  try {
    state.conn = await state.promise;
  } catch (e) {
    state.promise = null;
    throw e;
  }

  return state.conn!;
}

export default connectDB;
