//src/components/medical/AiChat.tsx

import { useEffect, useRef, useState } from "react";

export default function AiChat({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🔥 Slide animation trigger
  useEffect(() => {
    setTimeout(() => setOpen(true), 10);
    inputRef.current?.focus();
  }, []);

  // 🔥 Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const API_BASE =
    import.meta.env.VITE_API_BASE || "https://healynx.onrender.com";

  const sendMessage = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim()) return;

    const userMessage = { type: "user", text };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/medical/ask-ai/${patientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Required for cookie-based auth
          body: JSON.stringify({ question: text }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: data.answer || "No response from AI",
        },
      ]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "⚠️ Error connecting to AI service" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    "Give full summary",
    "List allergies",
    "Current medications",
    "Recent visits",
    "Lab results",
    "Surgery details",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-[40%] max-w-[600px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">AI Clinical Assistant</h2>
            <p className="text-xs text-gray-500">
              Ask anything about this patient
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b flex flex-wrap gap-2">
          {quickActions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400">
              Ask a question to get insights about the patient...
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.type === "user" ? "text-right" : "text-left"}
            >
              <div
                className={`inline-block px-3 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                  m.type === "user"
                    ? "bg-indigo-600 text-white ml-auto"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="text-left">
              <div className="inline-block px-3 py-2 rounded-2xl bg-gray-100 text-gray-500 text-sm animate-pulse">
                AI is analyzing...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask about patient..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
