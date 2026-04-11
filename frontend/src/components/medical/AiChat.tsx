import { useEffect, useRef, useState } from "react";

import apiClient from "../../api/apiClient";

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

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 10);
    inputRef.current?.focus();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text) return;

    const userMessage = { type: "user", text };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await apiClient.post(`/api/v1/medical/ask-ai/${patientId}`, {
        question: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: data.answer || "No response from AI",
        },
      ]);
    } catch (err) {
      console.error("AI request failed", err);
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "Error connecting to AI service" },
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
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative h-full w-[40%] max-w-[600px] transform flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } flex`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">AI Clinical Assistant</h2>
            <p className="text-xs text-gray-500">
              Ask anything about this patient
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-black"
          >
            x
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b p-3">
          {quickActions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400">
              Ask a question to get insights about the patient...
            </p>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.type}-${index}`}
              className={message.type === "user" ? "text-right" : "text-left"}
            >
              <div
                className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                  message.type === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left">
              <div className="inline-block rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-500 animate-pulse">
                AI is analyzing...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2 border-t p-3">
          <input
            ref={inputRef}
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask about patient..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
