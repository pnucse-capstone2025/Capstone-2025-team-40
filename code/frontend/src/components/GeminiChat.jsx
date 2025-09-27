import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai@0.11.2"
import ReactMarkdown from 'react-markdown';

const genAI  = new GoogleGenerativeAI("AIzaSyCVPCgS_yYhlHiyoZBg7oLGCxRfhLHNC3s");

const GeminiChat = ({ maxMemory = 10, placeholder = "Type a message...", itineraryContext = "", weatherContext = ""}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const systemInstruction = `You are an expert travel assistant. The user has the following itinerary and might ask questions about it. Use this context to provide helpful answers.\n\n--- ITINERARY START ---\n${itineraryContext}\n--- ITINERARY END --- --- WEATHER START ---${weatherContext}--- WEATHER END ---\n\n`;
      
      const promptHistory = newMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
      const fullPrompt = systemInstruction + promptHistory;
      
      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      const aiReply = response.candidates[0].content.parts[0].text;
      
      console.log("AI Reply Type:", typeof aiReply);
      console.log("AI Reply Content:", aiReply);

      let updatedMessages = [...newMessages, { role: "assistant", content: aiReply }];
      if (updatedMessages.length > maxMemory) updatedMessages.shift();
      setMessages(updatedMessages);

    } catch (err) {
      console.error("AI Error:", err);
      const updatedMessages = [
        ...newMessages,
        { role: "assistant", content: "Sorry, I couldn't get a response. Please check the console for errors." },
      ];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
  };

  return (
    <>
      <style>{`
        /* Your existing styles are fine, no changes needed here */
        .gemma-chat-container { background: white; border: none; border-radius: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .gemma-chat-box { background: white; }
        .gemma-chat-box::-webkit-scrollbar { width: 5px; }
        .gemma-chat-box::-webkit-scrollbar-track { background: transparent; }
        .gemma-chat-box::-webkit-scrollbar-thumb { background: #dddddd; border-radius: 10px; }
        .gemma-chat-box::-webkit-scrollbar-thumb:hover { background: #bbbbbb; }
        .gemma-msg .gemma-bubble { max-width: 75%; word-wrap: break-word; font-size: 0.95rem; line-height: 1.4; transition: all 0.2s ease-in-out; }
        .gemma-user { background: #F3E9DC; color: #212529; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .gemma-ai { background: transparent; box-shadow: none; padding: 0; max-width: 100%; width: 100%; }
        .markdown-content { color: #343a40; font-size: 0.95rem; line-height: 1.6; text-align: left; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-content code { background-color: #f1f3f5; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
        .markdown-content pre { background-color: #f1f3f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .gemma-input { border: 1px solid #dee2e6; padding-left: 1rem; font-size: 1rem; }
        .gemma-input:focus { box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25); }
        .gemma-send-btn { background-color: #007bff; border: none; transition: background-color 0.2s ease; }
        .gemma-send-btn:hover { background-color: #0056b3; }
        .gemma-send-btn:disabled { background-color: #a0c7ff; cursor: not-allowed; }
        .gemma-input-container { border-top: none !important; }
        .typing-indicator { display: flex; align-items: center; justify-content: center; width: 100%; padding: 0.5rem 0.75rem; }
        .typing-indicator .dot-container { background: #e9ecef; border-radius: 1.25rem; padding: 0.75rem 1rem;}
        .typing-indicator span { height: 8px; width: 8px; background-color: #adb5bd; border-radius: 50%; display: inline-block; margin: 0 2px; animation: bounce 1.4s infinite ease-in-out both; }
        .typing-indicator span:nth-of-type(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-of-type(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>

      <div className="gemma-chat-container d-flex flex-column shadow-sm rounded-4" style={{ height: "100%" }}>
        <div className="gemma-chat-box flex-grow-1 p-3 overflow-auto" ref={chatBoxRef}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`gemma-msg mb-3 d-flex ${
                msg.role === "user" ? "justify-content-end" : "justify-content-start" // Align AI messages left
              }`}
            >
              <div
                className={`gemma-bubble ${
                  msg.role === "user" ? "gemma-user p-3" : "gemma-ai"
                }`}
              >
                {msg.role === 'user' ? (
                  <>
                    <div className="small fw-bold mb-1">You</div>
                    <div>{msg.content}</div>
                  </>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="typing-indicator">
                <div className="dot-container">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
          )}
        </div>

        <div className="gemma-input-container d-flex p-3 bg-white border-top rounded-bottom-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="form-control gemma-input rounded-pill me-2 shadow-sm"
            disabled={isLoading}
          />
          <button
            className="btn btn-primary gemma-send-btn rounded-circle d-flex justify-content-center align-items-center shadow-sm"
            onClick={sendMessage}
            style={{ width: "48px", height: "48px" }}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-arrow-up" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 12a.5.5 0 0 1-.5-.5V3.707L4.354 7.854a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L8.5 3.707V11.5A.5.5 0 0 1 8 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default GeminiChat;
