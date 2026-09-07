import mongoose from 'mongoose';
import dns from 'dns';

/**
 * Global interface extension for caching Mongoose connection across hot-reloads
 */
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Manually resolves MongoDB SRV and TXT records to construct a standard connection string.
 * Fallback for environments where Node's internal SRV resolution fails (ECONNREFUSED).
 */
async function resolveManualUri(srvUri: string): Promise<string | null> {
  try {
    console.log("🔍 Attempting manual SRV resolution...");
    const url = new URL(srvUri.replace("mongodb+srv://", "http://"));
    const username = url.username;
    const password = url.password;
    const hostname = url.hostname;
    const searchParams = url.searchParams;

    const dnsPromises = dns.promises;

    // 1. Resolve SRV records
    const srvHostname = `_mongodb._tcp.${hostname}`;
    const srvRecords = await dnsPromises.resolveSrv(srvHostname);
    if (!srvRecords || srvRecords.length === 0) {
      throw new Error("No SRV records found");
    }

    const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(",");

    // 2. Resolve TXT records for options (like replicaSet)
    let extraOptions = "";
    try {
      const txtRecords = await dnsPromises.resolveTxt(hostname);
      if (txtRecords && txtRecords.length > 0) {
        extraOptions = txtRecords.flat().join("&");
      }
    } catch (e: any) {
      console.warn("⚠️ TXT resolution failed, using default options:", e.message);
    }

    // 3. Construct Standard URI
    const finalOptions = new URLSearchParams(searchParams);
    if (extraOptions) {
      const txtParams = new URLSearchParams(extraOptions);
      txtParams.forEach((value, key) => {
        if (!finalOptions.has(key)) finalOptions.set(key, value);
      });
    }

    if (!finalOptions.has("ssl") && !finalOptions.has("tls")) {
      finalOptions.set("ssl", "true");
    }

    const standardUri = `mongodb://${username}:${password}@${hosts}/?${finalOptions.toString()}`;
    console.log("✅ Manual URI constructed successfully");
    return standardUri;
  } catch (error: any) {
    console.error("❌ Manual resolution failed:", error.message);
    return null;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI missing from environment variables");
  }

  if (typeof dns.setDefaultResultOrder === 'function') {
    try {
      dns.setDefaultResultOrder("ipv4first");
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e: any) {
      console.warn("⚠️ Failed to set DNS servers:", e.message);
    }
  }

  const opts = {
    family: 4,
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  };

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        console.log("⏳ Connecting to MongoDB...");
        const conn = await mongoose.connect(MONGODB_URI, opts);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (error: any) {
        if ((error.message && (error.message.includes("querySrv") || error.message.includes("SRV"))) || error.code === "ECONNREFUSED") {
          console.warn("⚠️ SRV Connection failed, trying Smart Fallback...");
          const manualUri = await resolveManualUri(MONGODB_URI);
          if (manualUri) {
            console.log("🔄 Retrying with standard connection string...");
            const conn = await mongoose.connect(manualUri, opts);
            console.log(`✅ MongoDB Connected (via Fallback): ${conn.connection.host}`);
            return conn;
          }
        }
        throw error;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    // Auto-repair legacy non-sparse MongoDB indexes if present
    const { fixRegistrationIndexes } = await import('./models/Registration');
    await fixRegistrationIndexes();
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
