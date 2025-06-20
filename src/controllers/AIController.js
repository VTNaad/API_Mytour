const {
  model,
  generationConfig,
  safetySetting,
} = require("../config/geminiAI");

class AIController {
  async ChatAI(req, res) {
    try {
      const { messages } = req.body;
      // vd về messages có mảng lưu các tin nhắn
      // messages = [
      //     { text: 'Hello, how are you?', sender: 'user' },
      //     { text: 'I am good. How can I assist you?', sender: 'bot' },
      //   ];
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Invalid messages" });
      }

      const prompt = messages.map((m) => m.text).join("\n");
      const chatSession = model.startChat({
        generationConfig,
        safetySetting,
      });

      const result = await chatSession.sendMessage(prompt);
      const botMessage = result.response.text();

      res.status(200).json({
        success: true,
        userMessages: messages,
        botReply: botMessage,
      });
    } catch (error) {
      console.error("Error in AIController:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }
}

module.exports = new AIController();
