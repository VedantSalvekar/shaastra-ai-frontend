// src/app/dashboard/page.tsx
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { authenticatedFetch, ApiError } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function DashboardContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use authenticated fetch for API calls
      const res = await authenticatedFetch(`${API_BASE_URL}/rag/answer`, {
        method: "POST",
        body: JSON.stringify({
          collection: "legal-knowledge",
          question,
          top_k: 4,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error("RAG answer error:", res.status, errorBody);
        const errorMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, there was an error processing your request. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const data = await res.json();
      const assistantMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        content: data.answer ?? "I couldn't generate an answer.",
        sources: data.sources ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Network error:", err);
      
      // Don't show error if it's a 401 (handled by authenticatedFetch)
      if (err instanceof ApiError && err.status === 401) {
        return;
      }

      const errorMsg: Message = {
        id: Date.now() + 3,
        role: "assistant",
        content:
          "There was a network error talking to the backend. Check if the server is running on port 8000.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  //   return (
  //     <div className="flex flex-col items-center px-4 py-8">
  //       <div className="text-center mb-8">
  //         <h1 className="text-3xl md:text-4xl font-semibold mb-3">
  //           Ready when you are.
  //         </h1>
  //         {/* <p className="text-slate-400 text-sm md:text-base">
  //           Ask about work hours, visas, GNIB, PPS, Revenue letters, rental
  //           issues, or anything related to your life admin in Ireland.
  //         </p> */}
  //       </div>

  //       <div className="w-full max-w-4xl bg-slate-900/70  rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-md">
  //         <div
  //           ref={scrollContainerRef}
  //           className="h-[55vh] min-h-[340px] overflow-y-auto px-4 py-6 sm:px-6 space-y-4"
  //         >
  //           {messages.length === 0 ? (
  //             <div className="text-sm text-slate-500 text-center">
  //               Start chatting to see your conversation here.
  //             </div>
  //           ) : (
  //             messages.map((msg) => {
  //               const isUser = msg.role === "user";

  //               return (
  //                 <div
  //                   key={msg.id}
  //                   className={`flex gap-3 ${
  //                     isUser ? "justify-end" : "justify-start"
  //                   }`}
  //                 >
  //                   {!isUser && (
  //                     <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 flex items-center justify-center text-xs font-semibold">
  //                       AI
  //                     </div>
  //                   )}
  //                   <div
  //                     className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
  //                       isUser
  //                         ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-50"
  //                         : "bg-slate-800/80 border border-slate-700 text-slate-100"
  //                     }`}
  //                   >
  //                     {msg.content}
  //                   </div>
  //                   {isUser && (
  //                     <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-semibold">
  //                       You
  //                     </div>
  //                   )}
  //                 </div>
  //               );
  //             })
  //           )}
  //         </div>

  //         <form onSubmit={handleSend} className=" px-4 py-4 sm:px-6 sm:py-5">
  //           <div className="flex items-center gap-3 bg-slate-900 rounded-full px-4 py-3 shadow-lg shadow-black/40 border border-slate-800">
  //             <button
  //               type="button"
  //               className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 text-base"
  //             >
  //               +
  //             </button>

  //             <input
  //               className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 outline-none"
  //               placeholder="Ask something… e.g. Can I work more than 20 hours on Stamp 2?"
  //               value={input}
  //               onChange={(e) => setInput(e.target.value)}
  //             />

  //             <button
  //               type="submit"
  //               className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-semibold transition-colors"
  //             >
  //               ✔️
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="text-center py-6 px-4 shrink-0">
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">
          Ready when you are.
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Ask about work hours, stamps, PPS numbers, tax, or everyday life admin
          as an international in Ireland.
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scroll"
        ref={scrollContainerRef}
      >
        <div className="flex flex-col items-center min-h-full">
          <div className="w-full max-w-3xl flex-1 flex flex-col relative px-4 sm:px-6">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-xs text-slate-500 mt-4">
                  Try asking:{" "}
                  <span className="italic">
                    &quot;Can I work more than 20 hours on Stamp 2?&quot;
                  </span>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        isUser
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-900 text-slate-100 border border-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 border-t border-slate-700 pt-2 text-xs text-slate-300">
                          <p className="font-medium mb-1">Sources:</p>
                          <ul className="space-y-1">
                            {(() => {
                              // Deduplicate sources by URL
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

                                const labelParts = [
                                  provider,
                                  topic,
                                  subtopic,
                                ].filter(Boolean);
                                const label =
                                  labelParts.length > 0
                                    ? labelParts.join(" / ")
                                    : `Source ${idx + 1}`;

                                return (
                                  <li key={idx} className="flex flex-col">
                                    <span>• {label}</span>
                                    {url && (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                                      >
                                        Open official page
                                      </a>
                                    )}
                                  </li>
                                );
                              });
                            })()}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 px-3 py-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                    Thinking with Irish legal docs…
                  </div>
                </div>
              )}

              <div className="h-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center px-4 pb-4 shrink-0">
        <div className="w-full max-w-3xl">
          <form onSubmit={handleSend} className="w-full">
            <div className="flex items-center gap-3 bg-slate-900 rounded-full px-4 py-3 border border-slate-800">
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 text-lg"
              >
                +
              </button>

              <input
                className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 outline-none"
                placeholder="Ask something… e.g. Can I work more than 20 hours on Stamp 2?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:hover:bg-emerald-500 text-slate-950 text-sm font-semibold"
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
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
