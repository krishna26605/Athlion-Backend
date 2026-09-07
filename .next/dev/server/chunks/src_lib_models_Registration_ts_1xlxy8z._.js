module.exports = [
"[project]/src/lib/models/Registration.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "fixRegistrationIndexes",
    ()=>fixRegistrationIndexes
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const registrationSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    user: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'Event',
        required: true
    },
    batchNumber: {
        type: Number
    },
    batchTime: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: [
            'pending',
            'completed',
            'failed'
        ],
        default: 'pending'
    },
    checkInStatus: {
        type: Boolean,
        default: false
    },
    qrCode: {
        type: String
    },
    orderId: {
        type: String,
        required: true
    },
    paymentId: {
        type: String
    },
    amountPaid: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'Coupon'
    },
    height: {
        type: Number
    },
    weight: {
        type: Number
    },
    level: {
        type: String,
        enum: [
            'elite',
            'classical'
        ]
    },
    category: {
        type: String,
        default: 'Single'
    },
    discountType: {
        type: String,
        enum: [
            'super_early',
            'early',
            'coupon',
            'none'
        ],
        default: 'none'
    },
    discountValue: {
        type: Number,
        default: 0
    },
    discountLabel: {
        type: String,
        default: ''
    },
    verificationCode: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: {
        type: Date
    }
});
registrationSchema.index({
    user: 1,
    event: 1
}, {
    unique: true
});
registrationSchema.index({
    event: 1
});
registrationSchema.index({
    qrCode: 1
}, {
    unique: true,
    partialFilterExpression: {
        qrCode: {
            $type: 'string'
        }
    }
});
const Registration = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Registration || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Registration', registrationSchema);
async function fixRegistrationIndexes() {
    try {
        const collection = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.collection('registrations');
        if (!collection) return;
        // Clean up any existing documents where qrCode is explicit null
        await collection.updateMany({
            qrCode: null
        }, {
            $unset: {
                qrCode: ''
            }
        });
        const indexes = await collection.indexes();
        const qrIndex = indexes.find((i)=>i.name === 'qrCode_1');
        if (qrIndex && (!qrIndex.partialFilterExpression || !qrIndex.partialFilterExpression.qrCode)) {
            console.log('🔄 Dropping legacy non-partial qrCode_1 index...');
            await collection.dropIndex('qrCode_1');
            await Registration.syncIndexes();
            console.log('✅ Partial filter qrCode_1 index recreated successfully.');
        }
    } catch (e) {
    // Ignore if collection doesn't exist yet
    }
}
const __TURBOPACK__default__export__ = Registration;
}),
];

//# sourceMappingURL=src_lib_models_Registration_ts_1xlxy8z._.js.map