// src/app/dashboard/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function DashboardPage() {
  const defaultMessages: Message[] = [
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm the Shaastra AI assistant. Ask about visas, work hours, GNIB/IRP, PPS, Revenue, or upload a document and I'll break it down.",
    },
  ];

  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // TODO: call backend /chat API
  }

  return (
    <div className="flex flex-col items-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">
          Ready when you are.
        </h1>
        {/* <p className="text-slate-400 text-sm md:text-base">
          Ask about work hours, visas, GNIB, PPS, Revenue letters, rental
          issues, or anything related to your life admin in Ireland.
        </p> */}
      </div>

      <div className="w-full max-w-4xl bg-slate-900/70  rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-md">
        <div
          ref={scrollContainerRef}
          className="h-[55vh] min-h-[340px] overflow-y-auto px-4 py-6 sm:px-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="text-sm text-slate-500 text-center">
              Start chatting to see your conversation here.
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 flex items-center justify-center text-xs font-semibold">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                      isUser
                        ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-50"
                        : "bg-slate-800/80 border border-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {isUser && (
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-semibold">
                      You
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className=" px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 bg-slate-900 rounded-full px-4 py-3 shadow-lg shadow-black/40 border border-slate-800">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 text-base"
            >
              +
            </button>

            <input
              className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 outline-none"
              placeholder="Ask something… e.g. Can I work more than 20 hours on Stamp 2?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button
              type="submit"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-semibold transition-colors"
            >
              ✔️
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
