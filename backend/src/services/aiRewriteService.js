// services/aiRewriteService.js
// AI-powered text rewriting service for bios and captions

/**
 * Rewrite text using AI
 * Supports multiple AI providers: OpenAI, Anthropic, Groq, or Hugging Face
 * @param {string} text - The text to rewrite
 * @param {string} type - Type of text: 'bio' or 'caption'
 * @returns {Promise<string>} - Rewritten text
 */
export const rewriteTextWithAI = async (text, type = "caption") => {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  const provider = process.env.AI_PROVIDER || "mock";

  switch (provider.toLowerCase()) {
    case "openai":
      return await rewriteWithOpenAI(text, type);
    case "anthropic":
      return await rewriteWithAnthropic(text, type);
    case "groq":
      return await rewriteWithGroq(text, type);
    case "huggingface":
      return await rewriteWithHuggingFace(text, type);
    case "mock":
      return rewriteWithMockAI(text, type);
    default:
      return rewriteWithMockAI(text, type);
  }
};

/**
 * Rewrite using OpenAI API
 */
const rewriteWithOpenAI = async (text, type) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const systemPrompt =
    type === "bio"
      ? "You are a professional copywriter. Rewrite the given artist bio to be compelling, engaging, and professional. Keep it concise (1-2 sentences max). Return ONLY the rewritten text, nothing else."
      : "You are a social media expert. Rewrite the given caption to be engaging, authentic, and suitable for a portfolio. Keep it concise (under 150 characters if possible). Return ONLY the rewritten text, nothing else.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unknown error";
      try {
        const error = await response.json();
        errorMessage = error.error?.message || "Unknown error";
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.error("OpenAI rewrite error:", err);
    throw err;
  }
};

/**
 * Rewrite using Anthropic Claude API
 */
const rewriteWithAnthropic = async (text, type) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const systemPrompt =
    type === "bio"
      ? "You are a professional copywriter. Rewrite the given artist bio to be compelling, engaging, and professional. Keep it concise (1-2 sentences max). Return ONLY the rewritten text, nothing else."
      : "You are a social media expert. Rewrite the given caption to be engaging, authentic, and suitable for a portfolio. Keep it concise (under 150 characters if possible). Return ONLY the rewritten text, nothing else.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unknown error";
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || "Unknown error";
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(`Anthropic API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text?.trim() || text;
  } catch (err) {
    console.error("Anthropic rewrite error:", err);
    throw err;
  }
};

/**
 * Rewrite using Groq API (Free tier available)
 */
const rewriteWithGroq = async (text, type) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const systemPrompt =
    type === "bio"
      ? "You are a professional copywriter. Rewrite the given artist bio to be compelling, engaging, and professional. Keep it concise (1-2 sentences max). Return ONLY the rewritten text, nothing else."
      : "You are a social media expert. Rewrite the given caption to be engaging, authentic, and suitable for a portfolio. Keep it concise (under 150 characters if possible). Return ONLY the rewritten text, nothing else.";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unknown error";
      try {
        const error = await response.json();
        errorMessage = error.error?.message || "Unknown error";
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.error("Groq rewrite error:", err);
    throw err;
  }
};

/**
 * Rewrite using Hugging Face Inference API
 */
const rewriteWithHuggingFace = async (text, type) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  const model =
    type === "bio"
      ? process.env.HUGGINGFACE_MODEL || "facebook/bart-large-cnn"
      : process.env.HUGGINGFACE_MODEL || "facebook/bart-large-cnn";

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      }
    );

    // Check status first
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = "Unknown error";

      // Try to parse error response
      if (contentType && contentType.includes("application/json")) {
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || "Unknown error";
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } else {
        // Non-JSON response (HTML error page, etc.)
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(`Hugging Face API error: ${errorMessage}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        "Hugging Face API returned non-JSON response. Please check your API key and model."
      );
    }

    const data = await response.json();
    return data[0]?.summary_text || text;
  } catch (err) {
    console.error("Hugging Face rewrite error:", err);
    throw err;
  }
};

/**
 * Mock AI rewriting (No API needed - works locally)
 * Generates intelligent variations of text
 */
const rewriteWithMockAI = (text, type) => {
  const templates = {
    bio: [
      `Passionate ${extractKeyword(text)} dedicated to creating ${extractKeyword(text, true)} works that inspire and engage audiences.`,
      `Talented ${extractKeyword(text)} specializing in ${extractKeyword(text, true)} with a focus on innovation and excellence.`,
      `Professional ${extractKeyword(text)} committed to delivering exceptional ${extractKeyword(text, true)} experiences for every client.`,
      `Creative ${extractKeyword(text)} with expertise in ${extractKeyword(text, true)} and a passion for pushing artistic boundaries.`,
      `Experienced ${extractKeyword(text)} bringing fresh perspectives and creative solutions to ${extractKeyword(text, true)} projects.`,
    ],
    caption: [
      `✨ ${text} — where creativity meets passion.`,
      `Showcasing the artistry of ${text}. Every detail matters.`,
      `${text} — a moment of pure creative expression.`,
      `Bringing ${text} to life. See the passion in every frame.`,
      `${text} captured with care and creativity. 🎨`,
      `The essence of ${text} in one powerful moment.`,
      `${text} — turning vision into reality.`,
    ],
  };

  const typeTemplates = templates[type] || templates.caption;
  const randomTemplate =
    typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

  console.log(`Mock AI rewrite (${type}):`, randomTemplate);
  return randomTemplate;
};

/**
 * Extract a meaningful keyword from text for mock AI
 */
function extractKeyword(text, capitalize = false) {
  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["the", "and", "with", "from"].includes(w.toLowerCase()));

  if (words.length === 0) return capitalize ? "Creative Work" : "artist";

  const keyword = words[0].toLowerCase().replace(/[^a-z]/g, "");
  return capitalize ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : keyword;
}
