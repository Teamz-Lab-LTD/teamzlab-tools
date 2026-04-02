/**
 * Teamz Lab Tools — Cloud Functions
 *
 * Backend for premium/auth-gated features:
 * - AI proxy (Claude API calls without exposing keys)
 * - Usage tracking & rate limiting
 * - Future: payments, user data sync
 *
 * All functions verify Firebase Auth tokens before processing.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { RateLimiter, sanitizeInput } from "@teamzlab/cloud-kit";

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

// ─── Helpers ───

/**
 * Verify the caller is authenticated
 */
function requireAuth(context) {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return context.auth;
}

/**
 * Track usage for a feature (daily limit enforcement)
 */
async function checkAndIncrementUsage(uid, feature, dailyLimit) {
  const today = new Date().toISOString().split("T")[0];
  const ref = db.collection("usage").doc(uid);
  const doc = await ref.get();
  const data = doc.exists ? doc.data() : {};

  // Reset if new day
  if (data.date !== today) {
    await ref.set({ date: today, [feature]: 1 }, { merge: true });
    return { used: 1, limit: dailyLimit, remaining: dailyLimit - 1 };
  }

  const used = (data[feature] || 0) + 1;
  if (used > dailyLimit) {
    throw new HttpsError(
      "resource-exhausted",
      `Daily limit reached (${dailyLimit}/${dailyLimit}). Upgrade for unlimited access.`
    );
  }

  await ref.update({ [feature]: FieldValue.increment(1) });
  return { used, limit: dailyLimit, remaining: dailyLimit - used };
}

// ─── Cloud Functions ───

/**
 * AI Proxy — sends prompts to AI backend (Claude/OpenRouter) on behalf of authenticated users.
 * Gated by daily usage limits. API keys stay server-side.
 *
 * Client usage:
 *   const result = await firebase.functions().httpsCallable('aiGenerate')({
 *     feature: 'interview-practice',
 *     prompt: 'Give me 5 behavioral interview questions for a software engineer role',
 *     options: { maxTokens: 500 }
 *   });
 */
export const aiGenerate = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const auth = requireAuth(request);
    const { feature, prompt, options = {} } = request.data;

    if (!feature || !prompt) {
      throw new HttpsError("invalid-argument", "Missing feature or prompt.");
    }

    // Sanitize input
    const cleanPrompt = sanitizeInput(prompt, { maxLength: 2000 });

    // Check usage (default 10/day for free tier)
    const dailyLimit = options.dailyLimit || 10;
    const usage = await checkAndIncrementUsage(auth.uid, feature, dailyLimit);

    // TODO: Add your AI provider here (Claude API, OpenRouter, etc.)
    // Example with OpenRouter (uncomment and add API key to Firebase config):
    //
    // import { OpenRouterClient } from "@teamzlab/cloud-kit";
    // const ai = new OpenRouterClient({ apiKey: process.env.OPENROUTER_API_KEY });
    // const result = await ai.chat({
    //   model: "anthropic/claude-sonnet-4",
    //   messages: [{ role: "user", content: cleanPrompt }],
    //   maxTokens: options.maxTokens || 500
    // });
    // return { text: result.content, usage };

    // Placeholder response until AI provider is configured
    return {
      text: "AI backend not configured yet. Add your API key to Firebase secrets.",
      usage,
      configured: false,
    };
  }
);

/**
 * Generate Interview Questions — AI creates tailored questions in real-time.
 * Every session is unique, personalized to the user's role, company, level.
 *
 * Client usage:
 *   const result = await firebase.functions().httpsCallable('generateQuestions')({
 *     role: 'Software Engineer',
 *     company: 'Google',
 *     level: 'senior',
 *     type: 'behavioral',
 *     industry: 'Technology',
 *     count: 5,
 *     difficulty: 3
 *   });
 *   // Returns: { questions: [{ q, f, c, why }], source: 'ai' }
 */
export const generateQuestions = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const auth = requireAuth(request);
    const { role, company, level, type, industry, count, difficulty } = request.data;

    if (!role && !type) {
      throw new HttpsError("invalid-argument", "Please provide a role or interview type.");
    }

    const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 15);
    const diffLabel = ["", "easy", "medium", "hard", "expert"][parseInt(difficulty) || 2];
    const typeLabel = type || "behavioral";
    const levelLabel = level || "mid";

    // Check usage (20 sessions/day for free tier)
    const usage = await checkAndIncrementUsage(auth.uid, "interview-questions", 20);

    const prompt = `You are an expert interview coach. Generate exactly ${numQuestions} unique ${typeLabel} interview questions for a ${levelLabel}-level ${role || "professional"}${company ? " applying at " + company : ""}${industry ? " in the " + industry + " industry" : ""}.

Difficulty: ${diffLabel}

For each question, provide a JSON array with these fields:
- "q": the interview question (specific, realistic, what real interviewers ask)
- "f": answer framework hint (STAR method for behavioral, structured approach for technical, etc.) — 1-2 sentences
- "c": competency being tested (one of: leadership, problem-solving, teamwork, communication, adaptability, technical, customer-focus, conflict-resolution, initiative, analytical)
- "why": why interviewers ask this — what they look for in a strong answer (1-2 sentences)

${typeLabel === "behavioral" ? "Use STAR-method format questions (Tell me about a time when...)." : ""}
${typeLabel === "technical" ? "Include system design, architecture, and domain-specific questions for " + (role || "the role") + "." : ""}
${typeLabel === "caseStudy" ? "Include market sizing, business strategy, and analytical framework questions." : ""}
${typeLabel === "situational" ? "Use hypothetical scenarios (What would you do if...)." : ""}
${company ? "Tailor questions to " + company + "'s known interview style and values." : ""}

Return ONLY a valid JSON array, no markdown, no explanation. Example:
[{"q":"Tell me about...","f":"STAR: Focus on...","c":"leadership","why":"Tests your ability to..."}]`;

    // Sanitize
    const cleanPrompt = sanitizeInput(prompt, { maxLength: 3000 });

    // TODO: Replace with actual AI call when API key is configured
    // import { OpenRouterClient } from "@teamzlab/cloud-kit";
    // const ai = new OpenRouterClient({ apiKey: process.env.OPENROUTER_API_KEY });
    // const result = await ai.chat({
    //   model: "anthropic/claude-sonnet-4",
    //   messages: [{ role: "user", content: cleanPrompt }],
    //   maxTokens: 2000
    // });
    // try {
    //   const questions = JSON.parse(result.content);
    //   return { questions, source: "ai", usage };
    // } catch (e) {
    //   return { questions: [], source: "ai-parse-error", usage, raw: result.content };
    // }

    // Placeholder: return empty until AI provider configured
    return {
      questions: [],
      source: "not-configured",
      usage,
      configured: false,
      message: "AI backend not configured. Add OPENROUTER_API_KEY to Firebase secrets and uncomment the AI call above."
    };
  }
);

/**
 * Get user profile + usage stats
 *
 * Client usage:
 *   const profile = await firebase.functions().httpsCallable('getProfile')();
 */
export const getProfile = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const auth = requireAuth(request);

    const [userDoc, usageDoc] = await Promise.all([
      db.collection("users").doc(auth.uid).get(),
      db.collection("usage").doc(auth.uid).get(),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const usage = usageDoc.exists ? usageDoc.data() : {};

    // Auto-create user profile on first call
    if (!userDoc.exists) {
      const profile = {
        displayName: auth.token.name || "",
        email: auth.token.email || "",
        photoURL: auth.token.picture || "",
        tier: "free",
        createdAt: FieldValue.serverTimestamp(),
      };
      await db.collection("users").doc(auth.uid).set(profile);
      return { profile, usage: { date: today }, tier: "free" };
    }

    return {
      profile: userDoc.data(),
      usage: usage.date === today ? usage : { date: today },
      tier: userDoc.data().tier || "free",
    };
  }
);
