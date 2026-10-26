import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  ChevronDown,
  Store,
  User,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  Users,
  Sparkles,
} from "lucide-react";
import "./AIChat.css";
import { API_URL } from "../../constants/api";

const QUICK_QUESTIONS = [
  "Stock running low?",
  "Pending payments",
  "Sales this month",
  "Best selling item",
  "Total profit",
];

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hello! How can I help you with your shop today?",
};

function getHeaderIcon(line) {
  const lower = line.toLowerCase();
  if (lower.includes("recommend") || lower.includes("tip") || lower.includes("advisor") || lower.includes("idea") || line.includes("💡")) {
    return <Lightbulb size={14} className="msg-header-icon tip" />;
  }
  if (lower.includes("alert") || lower.includes("urgent") || lower.includes("warning") || lower.includes("low stock") || line.includes("⚠️")) {
    return <AlertTriangle size={14} className="msg-header-icon alert" />;
  }
  if (lower.includes("status") || lower.includes("check") || lower.includes("healthy") || lower.includes("clear") || line.includes("✅")) {
    return <CheckCircle2 size={14} className="msg-header-icon check" />;
  }
  if (lower.includes("sale") || lower.includes("revenue") || lower.includes("profit") || lower.includes("top") || line.includes("📈")) {
    return <TrendingUp size={14} className="msg-header-icon trend" />;
  }
  if (lower.includes("stock") || lower.includes("product") || lower.includes("inventory") || line.includes("📦")) {
    return <Package size={14} className="msg-header-icon package" />;
  }
  if (lower.includes("customer") || lower.includes("debt") || lower.includes("due") || lower.includes("pay") || line.includes("👤")) {
    return <Users size={14} className="msg-header-icon users" />;
  }
  return <Sparkles size={14} className="msg-header-icon sparkle" />;
}

function cleanHeaderTitle(title) {
  return title
    .replace(/^#+\s*/, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F]/gu, "")
    .trim();
}

function formatInline(str) {
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={match.index} className="msg-code">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts;
}

function FormattedContent({ text }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="msg-formatted-body">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="msg-line-spacer" />;
        }

        if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
          const icon = getHeaderIcon(trimmed);
          const cleanTitle = cleanHeaderTitle(trimmed);
          return (
            <div key={idx} className="msg-header-row">
              {icon}
              <span className="msg-header-title">{formatInline(cleanTitle)}</span>
            </div>
          );
        }

        if (/^[-*•]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="msg-bullet-row">
              <span className="msg-bullet-symbol">•</span>
              <span className="msg-bullet-text">{formatInline(itemText)}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="msg-bullet-row">
              <span className="msg-num-badge">{numMatch[1]}.</span>
              <span className="msg-bullet-text">{formatInline(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <div key={idx} className="msg-text-line">
            {formatInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function AIChat() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [history, setHistory]   = useState([]);
  const [error, setError]       = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in to use the assistant.");
      }

      const res = await fetch(`${API_URL}/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      setHistory((prev) => [
        ...prev,
        { role: "user",      text: trimmed },
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setError(err.message || "Failed to connect. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  }

  function clearChat() {
    setMessages([WELCOME_MESSAGE]);
    setHistory([]);
    setError(null);
  }

  return (
    <>
      <button
        className={`shop-chat-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Shop assistant"
      >
        {open
          ? <ChevronDown size={18} />
          : <><MessageCircle size={17} /><span className="shop-chat-toggle-label">Ask</span></>
        }
      </button>

      {open && (
        <div className="shop-chat-panel">
          <div className="shop-chat-header">
            <div className="shop-chat-header-left">
              <div className="shop-chat-status-dot" />
              <Store size={14} className="shop-chat-header-icon" />
              <span className="shop-chat-header-name">Shop Assistant</span>
            </div>
            <div className="shop-chat-header-actions">
              <button
                className="shop-chat-icon-btn"
                onClick={clearChat}
                title="Clear chat"
                aria-label="Clear chat"
              >
                <Trash2 size={13} />
              </button>
              <button
                className="shop-chat-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="shop-chat-chips">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="shop-chat-chip"
                onClick={() => sendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="shop-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`shop-msg-row ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="shop-msg-avatar">
                    <Store size={13} />
                  </div>
                )}
                <div className="shop-msg-bubble">
                  {msg.role === "assistant" ? (
                    <FormattedContent text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="shop-msg-avatar user-avatar">
                    <User size={13} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="shop-msg-row assistant">
                <div className="shop-msg-avatar">
                  <Store size={13} />
                </div>
                <div className="shop-msg-bubble shop-msg-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {error && (
              <div className="shop-chat-error">
                <AlertCircle size={13} />
                <span>{error}</span>
                <button
                  className="shop-chat-retry"
                  onClick={() => {
                    setError(null);
                    const lastUser = [...messages].reverse().find((m) => m.role === "user");
                    if (lastUser) sendMessage(lastUser.text);
                  }}
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="shop-chat-input-row">
            <textarea
              ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
              className="shop-chat-input"
              rows={1}
              placeholder="Type your question..."
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="shop-chat-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChat;
