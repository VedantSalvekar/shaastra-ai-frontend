"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, getChatMessages, createChatSession, sendMessage, type Citation } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatSidebar from "@/components/ChatSidebar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

function DashboardContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function loadChatSession(sessionId: string) {
    try {
      setIsLoading(true);
      const chatMessages = await getChatMessages(sessionId);
      const formattedMessages: Message[] = chatMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        citations: msg.citations?.sources,
      }));
      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error("Failed to load chat session:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setCurrentSessionId(undefined);
  }

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;
      
      if (!sessionId) {
        const newSession = await createChatSession({
          title: question.substring(0, 50) + (question.length > 50 ? "..." : ""),
        });
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
      }

      const response = await sendMessage(sessionId, { content: question });

      const assistantMessage: Message = {
        id: response.id,
        role: "assistant",
        content: response.content,
        citations: response.citations?.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      setRefreshSidebar((prev) => prev + 1);
    } catch (err) {
      console.error("Network error:", err);
      
      // Don't show error if it's a 401 (handled by authenticatedFetch)
      if (err instanceof ApiError && err.status === 401) {
        return;
      }

      const errorMsg: Message = {
        id: `temp-${Date.now() + 3}`,
        role: "assistant",
        content:
          "There was a network error. Please check if the server is running.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {showSidebar && (
        <ChatSidebar
          key={refreshSidebar}
          currentSessionId={currentSessionId}
          onSelectSession={loadChatSession}
          onNewChat={handleNewChat}
        />
      )}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between py-4 px-6 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">
            {currentSessionId ? "Chat Session" : "New Chat"}
          </h1>
          <div className="w-9" />
        </div>

        <div
          className="flex-1 overflow-y-auto custom-scroll px-4"
          ref={scrollContainerRef}
        >
          <div className="max-w-3xl mx-auto py-6 space-y-4">
            {messages.length === 0 && !currentSessionId && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Ready when you are.</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Ask about work hours, stamps, PPS numbers, tax, or everyday life admin.
                </p>
                <p className="text-xs text-slate-500">
                  Try: <span className="italic">&quot;Can I work more than 20 hours on Stamp 2?&quot;</span>
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      isUser
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-900 text-slate-100 border border-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <details className="text-xs text-slate-300">
                          <summary className="cursor-pointer font-medium hover:text-slate-200">
                            View sources ({msg.citations.length})
                          </summary>
                          <ul className="mt-2 space-y-2 pl-2">
                            {msg.citations.map((citation, idx) => {
                              if (citation.type === "legal") {
                                return (
                                  <li key={idx} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
                                        Legal
                                      </span>
                                      <span>• {citation.title}</span>
                                    </div>
                                    {citation.snippet && (
                                      <p className="text-slate-400 italic ml-3 text-xs">
                                        &quot;{citation.snippet}&quot;
                                      </p>
                                    )}
                                    {citation.url && (
                                      <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-3"
                                      >
                                        View official source
                                      </a>
                                    )}
                                  </li>
                                );
                              } else {
                                return (
                                  <li key={idx} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">
                                        Your Document
                                      </span>
                                      <span>• {citation.title}</span>
                                    </div>
                                    {citation.snippet && (
                                      <p className="text-slate-400 italic ml-3 text-xs">
                                        &quot;{citation.snippet}&quot;
                                      </p>
                                    )}
                                  </li>
                                );
                              }
                            })}
                          </ul>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 px-4 py-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="w-full">
              <div className="flex items-center gap-3 bg-slate-900 rounded-full px-4 py-3 border border-slate-800">
                <input
                  className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 outline-none"
                  placeholder="Ask something…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:hover:bg-emerald-500 text-slate-950 text-sm font-semibold transition-colors"
                >
                  ➤
                </button>
              </div>
            </form>
          </div>
        </div>

        <style jsx>{`
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.25) transparent;
          }

          .custom-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.25);
            border-radius: 9999px;
          }

          .custom-scroll:hover::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.4);
          }
        `}</style>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-hidden">
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}
