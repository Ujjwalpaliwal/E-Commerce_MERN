import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy server/.env.example to server/.env and add your Atlas connection string."
    );
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);

  return conn;
}
