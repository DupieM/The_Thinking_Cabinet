const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
require("dotenv").config();

function applyCors(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return false;
  }
  return true;
}

// Limit concurrent instances (optional)
setGlobalOptions({ maxInstances: 10 });

// Cloud Function to generate story using OpenAI
exports.generateStory = onRequest(async (req, res) => {
  if (!applyCors(req, res)) return;

  try {
    const { storyName, genre, images } = req.body;

    if (!storyName || !genre || !images) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    let imageDescriptions = "The story includes these images: ";
    images.forEach((img, i) => {
      imageDescriptions += `${img.name}${i === images.length - 1 ? "" : ", "}`;
    });

    const prompt = `${imageDescriptions}. Write a ${genre} story titled "${storyName}" using around 150 to 170 words.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI storyteller." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const generatedStory = response.data.choices[0].message.content.trim();
    res.status(200).json({ story: generatedStory });
  } catch (error) {
    logger.error("Error generating story:", error);
    res.status(500).json({ error: "Failed to generate story" });
  }
});

exports.chatAboutStory = onRequest(async (req, res) => {
  if (!applyCors(req, res)) return;

  try {
    const { messages } = req.body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    logger.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});
