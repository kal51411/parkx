"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Sparkles, ArrowLeft, Send, Bot, User, Terminal, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your ParkX Operations Copilot. I have direct access to your parking locations, occupancy telemetry, revenue logs, and pricing rules. Ask me anything about your parking performance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiClient.post("/ai/chat", { message: query });
      const assistantMsg: Message = {
        role: "assistant",
        content: res.data.response,
        tools: res.data.tool_calls_made || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error("AI assistant query failed");
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "What was my revenue this month?",
    "What are my peak occupancy hours?",
    "Should I adjust my hourly pricing?",
    "How many no-shows or cancellations did I have?",
  ];

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col space-y-4">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex-1 flex flex-col overflow-hidden min-h-[600px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ParkX Operations AI</h2>
              <p className="text-[11px] text-slate-500">Grounded in real database queries &bull; Zero hallucinations</p>
            </div>
          </div>
          <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            PostgreSQL Connected
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] space-y-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "p-3.5 rounded-2xl bg-blue-600 text-white font-medium"
                    : "p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Tool calls execution badge */}
                {m.tools && m.tools.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10px] text-slate-500">
                    <div className="font-semibold flex items-center gap-1 text-slate-600">
                      <Terminal className="w-3 h-3 text-purple-600" /> Real Tools Executed:
                    </div>
                    {m.tools.map((t, i) => (
                      <div key={i} className="font-mono bg-white p-1 rounded border border-slate-200 text-slate-700">
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Querying database and generating analysis...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 whitespace-nowrap transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue trends, peak times, pricing recommendations..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
