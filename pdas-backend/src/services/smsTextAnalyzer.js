const Anthropic = require("@anthropic-ai/sdk");

// Create client using the environment variable
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Analyzes SMS content using Claude to determine phishing risk.
 * @param {string} content - The SMS body text
 * @param {string} [sender=""] - The SMS sender ID or number
 * @returns {Promise<object>}
 */
async function analyzeSmsText(content, sender = "") {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a cybersecurity expert specializing in SMS scam detection, particularly for Kenya (M-Pesa, Safaricom, KRA, banking scams).

Analyze the following SMS and return ONLY a valid JSON object with no extra text.

SMS Content: "${content}"
Sender: "${sender || "Unknown"}"

Return this exact JSON structure:
{
  "is_scam": true or false,
  "confidence_score": 0-100,
  "risk_level": "safe" or "suspicious" or "phishing",
  "category": "phishing" or "fraud" or "spam" or "smishing" or "legitimate",
  "red_flags": ["list of specific red flags found"],
  "scam_type": "e.g. M-Pesa scam, Prize scam, Bank fraud, KRA scam, or null if legitimate",
  "reasoning": "brief explanation of the verdict"
}`,
        },
      ],
    });

    const raw = response.content[0].text.trim();
    
    // We sanitize the response to ensure any markdown wrappers are removed before parsing
    const cleanedRaw = raw.replace(/^```json/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleanedRaw);

    return {
      success: true,
      analysis: parsed,
      risk_score: parsed.confidence_score,
    };
  } catch (error) {
    console.error("Claude SMS analysis error:", error.message);
    return {
      success: false,
      analysis: null,
      risk_score: 0,
      error: error.message,
    };
  }
}

module.exports = { analyzeSmsText };
