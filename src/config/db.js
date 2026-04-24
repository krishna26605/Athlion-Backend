const mongoose = require('mongoose');
const dns = require('dns');

/**
 * Manually resolves MongoDB SRV and TXT records to construct a standard connection string.
 * This is a fallback for environments where Node's internal SRV resolution fails (ECONNREFUSED).
 */
async function resolveManualUri(srvUri) {
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
        } catch (e) {
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

        // Ensure ssl is true for Atlas
        if (!finalOptions.has("ssl") && !finalOptions.has("tls")) {
            finalOptions.set("ssl", "true");
        }

        const standardUri = `mongodb://${username}:${password}@${hosts}/?${finalOptions.toString()}`;
        console.log("✅ Manual URI constructed successfully");
        return standardUri;
    } catch (error) {
        console.error("❌ Manual resolution failed:", error.message);
        return null;
    }
}

const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI missing from environment variables");
        return;
    }

    // Configure DNS
    if (typeof dns.setDefaultResultOrder === 'function') {
        try {
            dns.setDefaultResultOrder("ipv4first");
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
        } catch (e) {
            console.warn("⚠️ Failed to set DNS servers:", e.message);
        }
    }

    const opts = {
        family: 4
    };

    try {
        console.log("⏳ Connecting to MongoDB...");
        const conn = await mongoose.connect(MONGODB_URI, opts);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If it's a DNS SRV error, try the manual fallback
        if ((error.message && (error.message.includes("querySrv") || error.message.includes("SRV"))) || error.code === "ECONNREFUSED") {
            console.warn("⚠️ SRV Connection failed, trying Smart Fallback...");
            const manualUri = await resolveManualUri(MONGODB_URI);
            if (manualUri) {
                try {
                    console.log("🔄 Retrying with standard connection string...");
                    const conn = await mongoose.connect(manualUri, opts);
                    console.log(`✅ MongoDB Connected (via Fallback): ${conn.connection.host}`);
                    return;
                } catch (retryError) {
                    console.error(`❌ Fallback connection failed: ${retryError.message}`);
                }
            }
        }
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    }
};

module.exports = connectDB;

