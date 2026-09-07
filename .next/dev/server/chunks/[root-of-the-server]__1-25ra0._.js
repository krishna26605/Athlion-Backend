module.exports = [
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/src/app/api/analytics/track-visit/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$AnalyticsVisit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/models/AnalyticsVisit.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$response$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api-response.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(req) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        const body = await req.json();
        let { visitorId, utmSource, utmMedium, utmCampaign, gymReferralCode } = body;
        if (!visitorId) {
            visitorId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        }
        const ipAddress = req.headers.get('x-forwarded-for') || '';
        const userAgent = req.headers.get('user-agent') || '';
        const visit = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$AnalyticsVisit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].create({
            visitorId,
            utmSource: utmSource || 'direct',
            utmMedium: utmMedium || '',
            utmCampaign: utmCampaign || '',
            gymReferralCode: gymReferralCode || '',
            ipAddress,
            userAgent
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$response$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])({
            success: true,
            visitorId: visit.visitorId,
            message: 'Visit tracked successfully'
        }, 201);
    } catch (err) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$response$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])(err.message, 400);
    }
}
}),
"[project]/src/lib/api-response.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "errorResponse",
    ()=>errorResponse,
    "jsonResponse",
    ()=>jsonResponse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function jsonResponse(data, status = 200, headers = {}) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data, {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}
function errorResponse(message, status = 500, extra = {}) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: false,
        message,
        ...extra
    }, {
        status
    });
}
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectDB",
    ()=>connectDB,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dns__$5b$external$5d$__$28$dns$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dns [external] (dns, cjs)");
;
;
let cached = /*TURBOPACK member replacement*/ __turbopack_context__.g.mongooseCache;
if (!cached) {
    cached = /*TURBOPACK member replacement*/ __turbopack_context__.g.mongooseCache = {
        conn: null,
        promise: null
    };
}
/**
 * Manually resolves MongoDB SRV and TXT records to construct a standard connection string.
 * Fallback for environments where Node's internal SRV resolution fails (ECONNREFUSED).
 */ async function resolveManualUri(srvUri) {
    try {
        console.log("🔍 Attempting manual SRV resolution...");
        const url = new URL(srvUri.replace("mongodb+srv://", "http://"));
        const username = url.username;
        const password = url.password;
        const hostname = url.hostname;
        const searchParams = url.searchParams;
        const dnsPromises = __TURBOPACK__imported__module__$5b$externals$5d2f$dns__$5b$external$5d$__$28$dns$2c$__cjs$29$__["default"].promises;
        // 1. Resolve SRV records
        const srvHostname = `_mongodb._tcp.${hostname}`;
        const srvRecords = await dnsPromises.resolveSrv(srvHostname);
        if (!srvRecords || srvRecords.length === 0) {
            throw new Error("No SRV records found");
        }
        const hosts = srvRecords.map((r)=>`${r.name}:${r.port}`).join(",");
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
            txtParams.forEach((value, key)=>{
                if (!finalOptions.has(key)) finalOptions.set(key, value);
            });
        }
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
async function connectDB() {
    if (cached.conn && __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState === 1) {
        return cached.conn;
    }
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("❌ MONGODB_URI missing from environment variables");
    }
    if (typeof __TURBOPACK__imported__module__$5b$externals$5d2f$dns__$5b$external$5d$__$28$dns$2c$__cjs$29$__["default"].setDefaultResultOrder === 'function') {
        try {
            __TURBOPACK__imported__module__$5b$externals$5d2f$dns__$5b$external$5d$__$28$dns$2c$__cjs$29$__["default"].setDefaultResultOrder("ipv4first");
            __TURBOPACK__imported__module__$5b$externals$5d2f$dns__$5b$external$5d$__$28$dns$2c$__cjs$29$__["default"].setServers([
                "8.8.8.8",
                "1.1.1.1"
            ]);
        } catch (e) {
            console.warn("⚠️ Failed to set DNS servers:", e.message);
        }
    }
    const opts = {
        family: 4,
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
    };
    if (!cached.promise) {
        cached.promise = (async ()=>{
            try {
                console.log("⏳ Connecting to MongoDB...");
                const conn = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI, opts);
                console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
                return conn;
            } catch (error) {
                if (error.message && (error.message.includes("querySrv") || error.message.includes("SRV")) || error.code === "ECONNREFUSED") {
                    console.warn("⚠️ SRV Connection failed, trying Smart Fallback...");
                    const manualUri = await resolveManualUri(MONGODB_URI);
                    if (manualUri) {
                        console.log("🔄 Retrying with standard connection string...");
                        const conn = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(manualUri, opts);
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
        const { fixRegistrationIndexes } = await __turbopack_context__.A("[project]/src/lib/models/Registration.ts [app-route] (ecmascript, async loader)");
        await fixRegistrationIndexes();
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
const __TURBOPACK__default__export__ = connectDB;
}),
"[project]/src/lib/models/AnalyticsVisit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const analyticsVisitSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    visitorId: {
        type: String,
        required: true,
        index: true
    },
    utmSource: {
        type: String,
        default: 'direct'
    },
    utmMedium: {
        type: String,
        default: ''
    },
    utmCampaign: {
        type: String,
        default: ''
    },
    gymReferralCode: {
        type: String,
        default: '',
        index: true
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    convertedToEarlyAccess: {
        type: Boolean,
        default: false
    },
    convertedUserEmail: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const AnalyticsVisit = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.AnalyticsVisit || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('AnalyticsVisit', analyticsVisitSchema);
const __TURBOPACK__default__export__ = AnalyticsVisit;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1-25ra0._.js.map