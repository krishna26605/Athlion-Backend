const OpenAI = require("openai");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const EarlyBirdConfig = require("../models/EarlyBirdConfig");
const razorpay = require("../config/razorpay");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ─── PROVIDERS ───────────────────────────────────────────────────────
// Initialize clients conditionally (don't crash if key is missing)
let groqClient = null;
let geminiClient = null;

if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "YOUR_GROQ_API_KEY_HERE") {
  groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  console.log("✅ Groq AI client initialized");
}

if (process.env.GEMINI_API_KEY) {
  geminiClient = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  console.log("✅ Gemini AI client initialized");
}

// ─── TOOL DEFINITIONS ───────────────────────────────────────────────
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "getUpcomingEvents",
      description: "Get all upcoming ATHLiON fitness events/races with dates, venues, prices, and available spots.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getEventDetails",
      description: "Get detailed information about a specific event by name or city.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name or city of the event to search for" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRaceFormatInfo",
      description: "Get information about the ATHLiON race format, stations, rules, and levels.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "registerUserAccount",
      description: "Create a new user account on the ATHLiON platform. Requires name, email, phone, and password. Call this when the user wants to sign up / create an account / register on the platform.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the user" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number (10 digits)" },
          password: { type: "string", description: "Password (minimum 6 characters)" },
        },
        required: ["name", "email", "phone", "password"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "initiateEventPayment",
      description: "Start the payment process to register the logged-in user for a specific race/event. Creates a Razorpay payment order. Call this when a logged-in user confirms they want to pay and register for a race/event.",
      parameters: {
        type: "object",
        properties: {
          eventName: { type: "string", description: "Name or city of the event to register for" },
          level: { type: "string", enum: ["elite", "classical"], description: "The competition level (elite or classical)" },
          couponCode: { type: "string", description: "Optional coupon code for a discount" },
        },
        required: ["eventName", "level"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyRegistrations",
      description: "Get list of events/races the currently logged-in user is registered for.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ─── TOOL IMPLEMENTATIONS ────────────────────────────────────────────
const toolImplementations = {
  getUpcomingEvents: async (args, userId) => {
    try {
      const events = await Event.find({ status: "upcoming" })
        .select("name date venue price maxParticipants currentParticipants startTime")
        .lean();
      if (!events.length) return JSON.stringify({ message: "No upcoming events right now. Check back soon!" });
      return JSON.stringify(events.map(e => ({
        name: e.name,
        date: e.date,
        venue: e.venue?.address || "TBA",
        price: `₹${e.price}`,
        spotsLeft: e.maxParticipants - (e.currentParticipants || 0),
        startTime: e.startTime,
      })));
    } catch (err) {
      return JSON.stringify({ error: "Could not fetch events." });
    }
  },

  getEventDetails: async ({ name }) => {
    try {
      const event = await Event.findOne({ name: new RegExp(name, "i") }).lean();
      if (!event) return JSON.stringify({ message: `No event found matching "${name}".` });
      return JSON.stringify({
        name: event.name,
        date: event.date,
        venue: event.venue?.address,
        mapsLink: event.venue?.googleMapsLink,
        price: `₹${event.price}`,
        maxParticipants: event.maxParticipants,
        spotsLeft: event.maxParticipants - (event.currentParticipants || 0),
        startTime: event.startTime,
        status: event.status,
      });
    } catch (err) {
      return JSON.stringify({ error: "Could not fetch event details." });
    }
  },

  getRaceFormatInfo: async () => {
    return JSON.stringify({
      format: "1KM Run + 13 Functional Workout Stations",
      description: "ATHLiON is India's premier fitness racing series. Participants complete a 1km run interspersed with 13 different functional workout stations.",
      levels: ["Elite", "Classical"],
      categories: ["Single"],
      rules: "Complete each station before moving to the next. Timed from start to finish.",
    });
  },

  registerUserAccount: async ({ name, email, phone, password }) => {
    try {
      // Validate inputs
      if (!name || !email || !phone || !password) {
        return JSON.stringify({ success: false, message: "Please provide name, email, phone number, and password." });
      }
      if (password.length < 6) {
        return JSON.stringify({ success: false, message: "Password must be at least 6 characters long." });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        if (existingUser.email === email) {
          return JSON.stringify({ success: false, message: "An account with this email already exists. Please login instead." });
        }
        return JSON.stringify({ success: false, message: "An account with this phone number already exists. Please login instead." });
      }

      // Create user
      const user = await User.create({ name, email, password, phone, role: "participant" });

      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

      return JSON.stringify({
        success: true,
        message: `Account created successfully! Welcome to ATHLiON, ${name}! 🎉`,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return JSON.stringify({ success: false, message: `Registration failed: ${err.message}` });
    }
  },

  initiateEventPayment: async ({ eventName, level, couponCode }, userId) => {
    try {
      if (!userId) {
        return JSON.stringify({ success: false, message: "You need to be logged in to register for an event. Please create an account or login first." });
      }

      const event = await Event.findOne({ name: new RegExp(eventName, "i") });
      if (!event) {
        return JSON.stringify({ success: false, message: `No event found matching "${eventName}". Use getUpcomingEvents to see available races.` });
      }

      if (event.status !== "upcoming") {
        return JSON.stringify({ success: false, message: "This event is not open for registration." });
      }

      if (event.currentParticipants >= event.maxParticipants) {
        return JSON.stringify({ success: false, message: "Sorry, this event is fully booked!" });
      }

      // Check if already registered
      const existingCompleted = await Registration.findOne({ user: userId, event: event._id, paymentStatus: "completed" });
      if (existingCompleted) {
        return JSON.stringify({ success: false, message: "You are already registered for this event!" });
      }

      // Calculate discount
      let discount = { type: "none", value: 0, label: "", couponId: null };
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon && coupon.usageCount < coupon.usageLimit && new Date(coupon.expiryDate) > new Date()) {
          const discountAmount = coupon.type === "percentage"
            ? Math.round((event.price * coupon.value) / 100)
            : Math.min(coupon.value, event.price);
          discount = { type: "coupon", value: discountAmount, label: `Coupon ${coupon.code}`, couponId: coupon._id };
        }
      } else {
        const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
        if (ebConfig) {
          const confirmedCount = await Registration.countDocuments({ event: event._id, paymentStatus: "completed" });
          if (confirmedCount < ebConfig.superEarlyLimit) {
            const amt = ebConfig.superEarlyDiscountType === "percentage"
              ? Math.round((event.price * ebConfig.superEarlyDiscountValue) / 100)
              : Math.min(ebConfig.superEarlyDiscountValue, event.price);
            discount = { type: "super_early", value: amt, label: "Super Early Bird" };
          } else {
            const amt = ebConfig.earlyDiscountType === "percentage"
              ? Math.round((event.price * ebConfig.earlyDiscountValue) / 100)
              : Math.min(ebConfig.earlyDiscountValue, event.price);
            discount = { type: "early", value: amt, label: "Early Bird" };
          }
        }
      }

      const finalPrice = Math.max(event.price - discount.value, 0);

      // Create Razorpay Order
      const order = await razorpay.orders.create({
        amount: finalPrice * 100,
        currency: "INR",
        receipt: `chat_${Date.now()}_${userId.toString().substring(0, 5)}`,
      });

      // Create pending registration
      const existingPending = await Registration.findOne({ user: userId, event: event._id, paymentStatus: "pending" });
      let registration;
      if (existingPending) {
        existingPending.orderId = order.id;
        existingPending.amountPaid = finalPrice;
        existingPending.level = level;
        existingPending.category = "Single";
        existingPending.discountType = discount.type;
        existingPending.discountValue = discount.value;
        existingPending.discountLabel = discount.label;
        existingPending.couponUsed = discount.couponId || undefined;
        existingPending.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        await existingPending.save();
        registration = existingPending;
      } else {
        registration = await Registration.create({
          user: userId,
          event: event._id,
          orderId: order.id,
          amountPaid: finalPrice,
          paymentStatus: "pending",
          level,
          category: "Single",
          discountType: discount.type,
          discountValue: discount.value,
          discountLabel: discount.label,
          couponUsed: discount.couponId || undefined,
          verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        });
      }

      return JSON.stringify({
        success: true,
        action: "INITIATE_PAYMENT",
        message: `Order created! Opening payment for ${event.name} (${level}) — ₹${finalPrice}${discount.value > 0 ? ` (saved ₹${discount.value} with ${discount.label})` : ""}.`,
        paymentData: {
          orderId: order.id,
          amount: finalPrice,
          currency: "INR",
          eventName: event.name,
          registrationId: registration._id,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      return JSON.stringify({ success: false, message: `Could not initiate payment: ${err.message}` });
    }
  },

  getMyRegistrations: async (args, userId) => {
    try {
      if (!userId) {
        return JSON.stringify({ success: false, message: "You need to be logged in to check your registrations." });
      }

      const registrations = await Registration.find({ user: userId, paymentStatus: "completed" })
        .populate("event", "name date venue")
        .lean();

      if (!registrations.length) {
        return JSON.stringify({ success: true, message: "You haven't registered for any events yet. Check out /events to find your next race!" });
      }

      return JSON.stringify({
        success: true,
        registrations: registrations.map(r => ({
          event: r.event?.name,
          date: r.event?.date,
          venue: r.event?.venue?.address,
          level: r.level,
          status: r.checkInStatus ? "Checked In" : "Registered",
          qrCode: r.qrCode,
        })),
      });
    } catch (err) {
      return JSON.stringify({ success: false, message: "Could not fetch your registrations." });
    }
  },
};

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────
function getSystemPrompt(user) {
  return `You are the ATHLiON AI Assistant — a smart, energetic AI concierge for India's premier fitness racing platform.

ABOUT ATHLION:
- Fitness racing: 1KM Run + 13 Functional Workout Stations
- Two levels: Elite and Classical
- Website: https://athlion-frontend.vercel.app

YOUR CAPABILITIES:
1. Answer questions about ATHLiON races, format, stations, and rules.
2. Look up upcoming events from the database.
3. Look up specific event details (venue, date, price, spots left).
4. CREATE USER ACCOUNTS directly through conversation (ask for name, email, phone, password).
5. REGISTER USERS FOR EVENTS (ask which event and what level - elite or classical).
6. Show users their existing registrations.

ACCOUNT CREATION FLOW:
- When a user wants to create an account, collect these 4 fields one by one through natural conversation:
  1. Full Name
  2. Email Address
  3. Phone Number (10 digits)
  4. Password (minimum 6 characters)
- Once you have all 4, call the registerUserAccount tool.
- If registration is successful and returns a token, tell the user: "Your account has been created! Please login on the website with your email and password to access your dashboard."

EVENT REGISTRATION & PAYMENT FLOW:
- When a user wants to join/register/participate for a race:
  1. First check if they are logged in (see CURRENT USER below).
  2. If NOT logged in, ask them to create an account first or login.
  3. If logged in, ask which event they want (show upcoming events if needed).
  4. Ask their preferred level: Elite or Classical.
  5. Ask if they have a coupon code (optional).
  6. Call initiateEventPayment — this creates a Razorpay order and opens payment directly in the chat!
  7. The user will pay via Razorpay popup without leaving the chat.

CURRENT USER: ${user ? `Logged in as "${user.name}" (ID: ${user._id})` : "Not logged in (Guest)"}

TONE & RULES:
- Be energetic, motivational, and athletic. Short punchy sentences.
- Keep responses concise (under 150 words unless user asks for detail).
- Never expose database IDs, internal errors, or technical details.
- Use 1-2 emojis max per message.
- When collecting info for registration, ask ONE question at a time.`;
}

// ─── PROCESS TOOL CALLS ──────────────────────────────────────────────
async function processToolCalls(toolCalls, userId) {
  const results = [];
  for (const tc of toolCalls) {
    const fnName = tc.function.name;
    let args = {};
    try { args = JSON.parse(tc.function.arguments || "{}"); } catch (e) { /* empty */ }

    console.log(`  🛠️  Tool: ${fnName}(${JSON.stringify(args)})`);

    if (toolImplementations[fnName]) {
      const output = await toolImplementations[fnName](args, userId);
      results.push({ tool_call_id: tc.id, role: "tool", content: output });
    }
  }
  return results;
}

// ─── CHAT WITH A PROVIDER ────────────────────────────────────────────
async function chatWithProvider(client, modelName, systemPrompt, messages) {
  console.log(`  🤖 Trying: ${modelName}`);

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  let response = await client.chat.completions.create({
    model: modelName,
    messages: fullMessages,
    tools: toolDefinitions,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 600,
  });

  let choice = response.choices[0];
  return { choice, fullMessages };
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────
exports.handleChat = async (req, res) => {
  const { message, history } = req.body;
  const user = req.user;
  const userId = user ? user._id : null;

  console.log("🚀 AI Chat:", message, user ? `(User: ${user.name})` : "(Guest)");

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  // Build messages from history
  const conversationMessages = [];
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      if (msg.parts) {
        conversationMessages.push({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.parts[0]?.text || "",
        });
      } else if (msg.content) {
        conversationMessages.push({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.content,
        });
      }
    }
  }
  conversationMessages.push({ role: "user", content: message });

  const systemPrompt = getSystemPrompt(user);

  // Build provider chain
  const providers = [];
  if (groqClient) providers.push({ client: groqClient, model: "llama-3.3-70b-versatile", name: "Groq/Llama" });
  if (geminiClient) providers.push({ client: geminiClient, model: "gemini-2.0-flash-lite", name: "Gemini" });

  if (providers.length === 0) {
    return res.status(500).json({ message: "No AI provider configured. Please set GROQ_API_KEY or GEMINI_API_KEY." });
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      let { choice, fullMessages } = await chatWithProvider(
        provider.client, provider.model, systemPrompt, conversationMessages
      );

      // Handle tool calls loop (max 5 iterations)
      let iterations = 0;
      while (choice.finish_reason === "tool_calls" && iterations < 5) {
        const toolCalls = choice.message.tool_calls;
        const toolResults = await processToolCalls(toolCalls, userId);

        fullMessages.push(choice.message);
        fullMessages.push(...toolResults);

        const response2 = await provider.client.chat.completions.create({
          model: provider.model,
          messages: fullMessages,
          tools: toolDefinitions,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 600,
        });
        choice = response2.choices[0];
        iterations++;
      }

      const reply = choice.message.content || "I'm thinking... could you rephrase that?";
      console.log(`✅ Reply from ${provider.name}`);

      // Check if tool returned auth data (account creation)
      let authData = null;
      let paymentData = null;

      for (const m of fullMessages) {
        if (m.role !== "tool" || !m.content) continue;
        try {
          const parsed = JSON.parse(m.content);
          if (parsed.token) {
            authData = { token: parsed.token, user: parsed.user };
          }
          if (parsed.action === "INITIATE_PAYMENT" && parsed.paymentData) {
            paymentData = parsed.paymentData;
          }
        } catch (e) { /* ignore */ }
      }

      return res.status(200).json({
        reply,
        provider: provider.name,
        authData,
        paymentData, // Frontend opens Razorpay checkout with this
      });
    } catch (error) {
      console.warn(`⚠️ ${provider.name} failed:`, error.status || error.message);
      lastError = error;
      continue;
    }
  }

  console.error("❌ All providers failed:", lastError?.message);
  res.status(500).json({ message: "AI Assistant is temporarily unavailable. Please try again in a minute." });
};
