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
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  OpenRouterClient,
  extractJsonArray,
  sanitizeInput,
} from "@teamzlab/cloud-kit";

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);
const openRouteApiKey = defineSecret("OPENROUTE_API_KEY");
const AI_REFERER = "https://tool.teamzlab.com";
const AI_TITLE = "Teamz Lab Tools";
const INTERVIEW_COACH_SYSTEM_PROMPT =
  "You are Teamz Lab's interview coach. Follow the requested output format exactly. Return valid JSON when asked for JSON, otherwise return concise plain text with concrete, practical advice.";
const QUESTION_COMPETENCIES = new Set([
  "leadership",
  "problem-solving",
  "teamwork",
  "communication",
  "adaptability",
  "technical",
  "customer-focus",
  "conflict-resolution",
  "initiative",
  "analytical",
]);

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

function getOpenRouterApiKey() {
  try {
    const secretValue = openRouteApiKey.value();
    if (secretValue) return secretValue;
  } catch (err) {
    // Secret access is only available in environments where the secret is bound.
  }

  return process.env.OPENROUTE_API_KEY || process.env.OPENROUTER_API_KEY || "";
}

async function callInterviewAi(userPrompt, options = {}) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return null;

  const client = new OpenRouterClient({
    referer: AI_REFERER,
    title: AI_TITLE,
    maxTokens: options.maxTokens ?? 800,
    temperature: options.temperature ?? 0.2,
  });

  return client.call(
    apiKey,
    options.systemPrompt || INTERVIEW_COACH_SYSTEM_PROMPT,
    userPrompt
  );
}

function normalizeInterviewQuestions(items, fallbackDifficulty) {
  return items
    .map((item) => {
      const question = sanitizeInput(item?.q || item?.question || "", 280);
      if (!question) return null;

      const framework = sanitizeInput(
        item?.f || item?.framework || item?.hint || "",
        320
      );
      const why = sanitizeInput(item?.why || item?.reason || "", 320);
      const rawCompetency = sanitizeInput(
        item?.c || item?.competency || "communication",
        40
      ).toLowerCase();
      const competency = QUESTION_COMPETENCIES.has(rawCompetency)
        ? rawCompetency
        : "communication";

      return {
        q: question,
        f: framework,
        c: competency,
        why,
        d: fallbackDifficulty,
      };
    })
    .filter(Boolean);
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
  { region: "us-central1", cors: true, secrets: [openRouteApiKey] },
  async (request) => {
    const auth = requireAuth(request);
    const { feature, prompt, options = {} } = request.data;

    if (!feature || !prompt) {
      throw new HttpsError("invalid-argument", "Missing feature or prompt.");
    }

    // Prep plans include pasted job descriptions — allow larger prompts than short chat snippets
    const promptMaxLength =
      feature === "interview-prep-plan" ? 12000 : 4000;
    const cleanPrompt = sanitizeInput(prompt, promptMaxLength);

    if (!cleanPrompt) {
      throw new HttpsError("invalid-argument", "Prompt is empty after sanitization.");
    }

    const maxTokens = Math.min(Math.max(parseInt(options.maxTokens, 10) || 500, 150), 1800);
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      return {
        text: "",
        configured: false,
        message: "OPENROUTE_API_KEY is not configured.",
      };
    }

    // Check usage (default 10/day for free tier)
    const dailyLimit = options.dailyLimit || 10;
    const usage = await checkAndIncrementUsage(auth.uid, feature, dailyLimit);

    try {
      const text = await callInterviewAi(cleanPrompt, { maxTokens });
      if (!text) {
        throw new Error("AI provider returned empty content.");
      }
      return { text, usage, configured: true };
    } catch (err) {
      console.error("aiGenerate failed", err);
      throw new HttpsError("internal", "AI generation failed.");
    }
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
 *     jobDescription: '…pasted posting text…',
 *     jobPostUrl: 'https://…',
 *     companyUrl: 'https://…',
 *     count: 5,
 *     difficulty: 3
 *   });
 *   // Returns: { questions: [{ q, f, c, why }], source: 'ai' }
 */
export const generateQuestions = onCall(
  { region: "us-central1", cors: true, secrets: [openRouteApiKey] },
  async (request) => {
    const auth = requireAuth(request);
    const {
      role,
      company,
      level,
      type,
      industry,
      count,
      difficulty,
      jobDescription,
      jobPostUrl,
      companyUrl,
    } = request.data;

    if (!role && !type) {
      throw new HttpsError("invalid-argument", "Please provide a role or interview type.");
    }

    const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 15);
    const diffLabel = ["", "easy", "medium", "hard", "expert"][parseInt(difficulty) || 2];
    const typeLabel = type || "behavioral";
    const levelLabel = level || "mid";

    const cleanJobDesc = jobDescription
      ? sanitizeInput(String(jobDescription), 6000)
      : "";
    const cleanJobUrl = jobPostUrl
      ? sanitizeInput(String(jobPostUrl), 500)
      : "";
    const cleanCompanyUrl = companyUrl
      ? sanitizeInput(String(companyUrl), 500)
      : "";
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      return {
        questions: [],
        source: "not-configured",
        configured: false,
        message: "OPENROUTE_API_KEY is not configured.",
      };
    }

    let contextBlock = "";
    if (cleanJobDesc) {
      contextBlock += `\n\n--- Job description (primary source — use for skills, responsibilities, tools, and seniority) ---\n${cleanJobDesc}`;
    }
    if (cleanJobUrl) {
      contextBlock += `\n\nJob posting URL (candidate reference only — you cannot browse the web; use if you recognize the employer/posting type, otherwise rely on the job description text): ${cleanJobUrl}`;
    }
    if (cleanCompanyUrl) {
      contextBlock += `\n\nCompany website URL (candidate reference only): ${cleanCompanyUrl}`;
    }
    if (cleanJobDesc || cleanJobUrl || cleanCompanyUrl) {
      contextBlock +=
        "\n\nWhen job description text is present, prioritize it over generic role assumptions. Ask questions a hiring manager for THIS posting would plausibly ask.";
    }

    const prompt = `You are an expert interview coach. Generate exactly ${numQuestions} unique ${typeLabel} interview questions for a ${levelLabel}-level ${role || "professional"}${company ? " applying at " + company : ""}${industry ? " in the " + industry + " industry" : ""}.

Difficulty: ${diffLabel}
${contextBlock}

For each question, provide a JSON array with these fields:
- "q": the interview question (specific, realistic, what real interviewers ask)
- "f": answer framework hint (STAR method for behavioral, structured approach for technical, etc.) — 1-2 sentences
- "c": competency being tested (one of: leadership, problem-solving, teamwork, communication, adaptability, technical, customer-focus, conflict-resolution, initiative, analytical)
- "why": why interviewers ask this — what they look for in a strong answer (1-2 sentences)

${typeLabel === "behavioral" || String(typeLabel).includes("mixed") ? "Use STAR-method format questions (Tell me about a time when...) where appropriate for behavioral portions." : ""}
${typeLabel === "technical" || String(typeLabel).includes("mixed") ? "Include system design, architecture, and domain-specific questions for " + (role || "the role") + " when the interview type calls for technical depth." : ""}
${typeLabel === "caseStudy" ? "Include market sizing, business strategy, and analytical framework questions." : ""}
${typeLabel === "situational" || String(typeLabel).includes("mixed") ? "Use hypothetical scenarios (What would you do if...) where appropriate." : ""}
${company ? "Tailor questions to " + company + "'s known interview style and values where reasonable." : ""}

Return ONLY a valid JSON array, no markdown, no explanation. Example:
[{"q":"Tell me about...","f":"STAR: Focus on...","c":"leadership","why":"Tests your ability to..."}]`;

    const cleanPrompt = sanitizeInput(prompt, 12000);

    try {
      const raw = await callInterviewAi(cleanPrompt, {
        maxTokens: 2200,
        systemPrompt:
          "You are Teamz Lab's interview-question generator. Return only valid JSON arrays. No markdown, no prose, no code fences.",
      });
      const parsed = extractJsonArray(raw);
      const questions = normalizeInterviewQuestions(parsed, parseInt(difficulty, 10) || 2).slice(
        0,
        numQuestions
      );

      if (!questions.length) {
        return {
          questions: [],
          source: "ai-parse-error",
          configured: true,
          message: "AI returned no usable interview questions.",
        };
      }

      const usage = await checkAndIncrementUsage(auth.uid, "interview-questions", 20);
      return { questions, source: "ai", usage, configured: true };
    } catch (err) {
      console.error("generateQuestions failed", err);
      throw new HttpsError("internal", "Question generation failed.");
    }
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
