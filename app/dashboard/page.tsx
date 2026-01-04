"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { authenticatedFetch, ApiError, getChatMessages, createChatSession } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatSidebar from "@/components/ChatSidebar";

type SourceMetadata = {
  source?: string;
  topic?: string;
  subtopic?: string;
  url?: string;
  [key: string]: unknown;
};

type Source = {
  text: string;
  metadata: SourceMetadata;
  score: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
        sources: msg.citations?.sources as Source[] | undefined,
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

      const res = await authenticatedFetch(`${API_BASE_URL}/rag/answer`, {
        method: "POST",
        body: JSON.stringify({
          collection: "legal-knowledge",
          question,
          top_k: 4,
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error("RAG answer error:", res.status, errorBody);
        const errorMsg: Message = {
          id: `temp-${Date.now() + 1}`,
          role: "assistant",
          content:
            "Sorry, there was an error processing your request. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const data = await res.json();
      const assistantMessage: Message = {
        id: `temp-${Date.now() + 2}`,
        role: "assistant",
        content: data.answer ?? "I couldn't generate an answer.",
        sources: data.sources ?? [],
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
          "There was a network error talking to the backend. Check if the server is running on port 8000.",
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
          className="flex-1 overflow-y-auto custom-scroll"
          ref={scrollContainerRef}
        >
          <div className="flex flex-col items-center min-h-full">
            <div className="w-full max-w-3xl flex-1 flex flex-col relative px-4 sm:px-6">
              <div className="space-y-4 py-6">
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

                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <details className="text-xs text-slate-300">
                              <summary className="cursor-pointer font-medium hover:text-slate-200">
                                View sources ({msg.sources.length})
                              </summary>
                              <ul className="mt-2 space-y-2 pl-2">
                                {(() => {
                                  const uniqueSources = msg.sources.reduce((acc: Source[], src: Source) => {
                                    const url = (src.metadata?.url as string | undefined) || '';
                                    const isDuplicate = acc.some((item) => {
                                      const itemUrl = (item.metadata?.url as string | undefined) || '';
                                      return itemUrl && url && itemUrl === url;
                                    });
                                    if (!isDuplicate) {
                                      acc.push(src);
                                    }
                                    return acc;
                                  }, []);

                                  return uniqueSources.map((src, idx) => {
                                    const meta: SourceMetadata = src.metadata ?? {};
                                    const provider = meta.source ?? "source";
                                    const topic = meta.topic ?? "";
                                    const subtopic = meta.subtopic ?? "";
                                    const url = meta.url as string | undefined;

                                    const labelParts = [provider, topic, subtopic].filter(Boolean);
                                    const label = labelParts.length > 0 ? labelParts.join(" / ") : `Source ${idx + 1}`;

                                    return (
                                      <li key={idx} className="flex flex-col gap-1">
                                        <span>• {label}</span>
                                        {url && (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-3"
                                          >
                                            View reference
                                          </a>
                                        )}
                                      </li>
                                    );
                                  });
                                })()}
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

                <div className="h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center px-4 pb-4 shrink-0">
          <div className="w-full max-w-3xl">
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
      <DashboardContent />
    </ProtectedRoute>
  );
}
