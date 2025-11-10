import mongoose from "mongoose";

// Only run MongoDB connection logic on server side
if (typeof window === "undefined") {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }
}

interface GlobalMongoDB {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongodb: GlobalMongoDB | undefined;
}

let cached = global.mongodb;

if (!cached) {
  cached = global.mongodb = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // Return early if running on client side
  if (typeof window !== "undefined") {
    throw new Error("connectDB can only be called on the server side");
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  // console.log("MONGODB_URI:", MONGODB_URI);
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Connected to MongoDB");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
