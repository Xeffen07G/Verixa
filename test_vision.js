const Groq = require("groq-sdk");
require("dotenv").config({ path: "./backend/.env" });

async function testVision() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            { type: "image_url", image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_Google_DeepMind.svg/1200px-Logo_Google_DeepMind.svg.png" } }
          ]
        }
      ],
      max_tokens: 100
    });
    console.log("Success:", completion.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testVision();
