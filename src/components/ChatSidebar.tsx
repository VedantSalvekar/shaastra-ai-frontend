"use client";

import { useEffect, useState } from "react";
import { listChatSessions, type ChatSession } from "@/lib/api";

type ChatSidebarProps = {
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
};

export default function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await listChatSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-slate-500 text-center">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">No chat history yet</div>
        ) : (
          <div className="py-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors border-l-2 ${
                  currentSessionId === session.id
                    ? "bg-slate-800 border-emerald-500"
                    : "border-transparent"
                }`}
              >
                <div className="text-sm text-slate-200 truncate mb-1">{session.title}</div>
                <div className="text-xs text-slate-500">{formatDate(session.updated_at)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

