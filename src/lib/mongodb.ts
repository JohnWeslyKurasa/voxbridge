import mongoose from "mongoose";

/**
 * Reusable MongoDB Connection Adapter
 * 
 * Why it is needed:
 * - Next.js development uses hot-reloading. Every time a file compiles, Mongoose gets loaded again.
 * - Standard connections would spawn hundreds of duplicate sockets, saturating the MongoDB Atlas limit.
 * - This file caches the Mongoose connection state in Node's global object, persisting it across hot reloads.
 * 
 * How it works:
 * - Reads MONGODB_URI from environment variables.
 * - Initializes a cache structure on `globalThis`.
 * - If a cached connection exists, it returns it immediately.
 * - Otherwise, it creates a singleton promise using mongoose.connect and stores it.
 * 
 * Best Practices:
 * - Prevents multiple event listener registrations.
 * - Strict environment variable checking.
 * - TypeScript global namespace mapping to prevent compiler errors.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside your env configurations.");
}

// Map the Mongoose caching variables to Node's global namespace
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: GlobalMongoose | undefined;
}

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

export default async function connectToDatabase() {
  if (cached && cached.conn) {
    return cached.conn;
  }

  if (cached && !cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Restrict connection pool sizing for serverless functions
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      console.log("🟢 Successfully connected to MongoDB Atlas");
      return m;
    });
  }

  try {
    if (cached) {
      cached.conn = await cached.promise;
    }
  } catch (e) {
    if (cached) {
      cached.promise = null;
    }
    throw e;
  }

  return cached?.conn;
}
