import { useState, useMemo } from "react";
import { X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Simple markdown parser for chat messages
const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol';
      elements.push(
        <ListTag key={elements.length} className={listType === 'ul' ? 'list-disc pl-4 my-1' : 'list-decimal pl-4 my-1'}>
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  const parseInline = (text: string): React.ReactNode => {
    // Handle bold (**text** or __text__)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      if (boldMatch) {
        const before = remaining.slice(0, boldMatch.index);
        if (before) parts.push(before);
        parts.push(<strong key={key++}>{boldMatch[1] || boldMatch[2]}</strong>);
        remaining = remaining.slice((boldMatch.index || 0) + boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/\*(.+?)\*|_(.+?)_/);
      if (italicMatch) {
        const before = remaining.slice(0, italicMatch.index);
        if (before) parts.push(before);
        parts.push(<em key={key++}>{italicMatch[1] || italicMatch[2]}</em>);
        remaining = remaining.slice((italicMatch.index || 0) + italicMatch[0].length);
        continue;
      }

      // Code inline
      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch) {
        const before = remaining.slice(0, codeMatch.index);
        if (before) parts.push(before);
        parts.push(<code key={key++} className="bg-muted-foreground/20 px-1 rounded text-xs">{codeMatch[1]}</code>);
        remaining = remaining.slice((codeMatch.index || 0) + codeMatch[0].length);
        continue;
      }

      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={elements.length} className="font-semibold text-sm mt-2 mb-1">{parseInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={elements.length} className="font-semibold mt-2 mb-1">{parseInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={elements.length} className="font-bold mt-2 mb-1">{parseInline(line.slice(2))}</h2>);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\-\*]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    // Regular paragraph or empty line
    flushList();
    if (line.trim() === '') {
      elements.push(<div key={elements.length} className="h-2" />);
    } else {
      elements.push(<p key={elements.length} className="my-0.5">{parseInline(line)}</p>);
    }
  }

  flushList();
  return elements;
};

// Memoized markdown component
const MarkdownContent = ({ content }: { content: string }) => {
  const parsed = useMemo(() => parseMarkdown(content), [content]);
  return <div className="space-y-0">{parsed}</div>;
};

const GradientSparkle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="panelSparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ECDC4" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" stroke="url(#panelSparkleGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialSuggestions = [
  "Which projects are running late?",
  "How much CAPEX have we spent so far?",
  "Do we have any savings this quarter?",
];

// Context-aware follow-up suggestions based on conversation topics
const suggestionsByTopic: Record<string, string[]> = {
  projects: [
    "Show project timeline",
    "List team members",
    "Export project report",
  ],
  late: [
    "Show delay reasons",
    "Notify stakeholders",
    "Suggest mitigation plan",
  ],
  capex: [
    "Break down by category",
    "Compare to last year",
    "Forecast next quarter",
  ],
  budget: [
    "Show budget variance",
    "Identify overspending",
    "Reallocate funds",
  ],
  savings: [
    "Detail savings sources",
    "Project annual savings",
    "Share with finance team",
  ],
  report: [
    "Add charts and graphs",
    "Include executive summary",
    "Schedule recurring report",
  ],
  compare: [
    "Show trend analysis",
    "Highlight key changes",
    "Export comparison",
  ],
  actions: [
    "Set reminders",
    "Assign to team",
    "Track progress",
  ],
  default: [
    "Schedule monthly report",
    "Compare to previous month",
    "Suggest relevant actions",
  ],
};

// Detect topic from user message
const detectTopic = (messages: Message[]): string => {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (userMessages.includes("late") || userMessages.includes("delay") || userMessages.includes("behind")) {
    return "late";
  }
  if (userMessages.includes("capex") || userMessages.includes("spent") || userMessages.includes("spending")) {
    return "capex";
  }
  if (userMessages.includes("budget") || userMessages.includes("cost")) {
    return "budget";
  }
  if (userMessages.includes("saving") || userMessages.includes("savings")) {
    return "savings";
  }
  if (userMessages.includes("report") || userMessages.includes("schedule")) {
    return "report";
  }
  if (userMessages.includes("compare") || userMessages.includes("previous") || userMessages.includes("last")) {
    return "compare";
  }
  if (userMessages.includes("action") || userMessages.includes("suggest") || userMessages.includes("recommend")) {
    return "actions";
  }
  if (userMessages.includes("project")) {
    return "projects";
  }
  return "default";
};

const defaultFollowUps = [
  "Schedule monthly report",
  "Compare to previous month",
  "Suggest relevant actions",
];

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot`;

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Count how many exchanges have happened (user + assistant pairs)
  const exchangeCount = Math.floor(messages.filter(m => m.role === "assistant" && m.content).length);

  // First response always shows default suggestions, then context-aware
  const currentSuggestions = exchangeCount <= 1
    ? defaultFollowUps
    : (suggestionsByTopic[detectTopic(messages)] || defaultFollowUps);

  const handleClose = () => {
    // Reset conversation state when closing
    setMessages([]);
    setInput("");
    setIsLoading(false);
    onClose();
  };

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(COPILOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        throw new Error("Rate limit exceeded");
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add funds to your workspace.");
        throw new Error("Payment required");
      }
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Add empty assistant message that we'll update
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: assistantContent,
              };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: assistantContent,
              };
              return newMessages;
            });
          }
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error("Copilot error:", error);
      if (!messages.find((m) => m.role === "assistant" && m.content === "")) {
        // Only show error if we haven't already added an assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[420px] bg-card border-l border-border shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GradientSparkle className="h-5 w-5" />
            <span className="font-semibold text-foreground">Copilot</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <GradientSparkle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                How can I help you?
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-8 max-w-[280px]">
                Ask me about your projects, budgets, timelines, and more.
              </p>

              {/* Suggestions */}
              <div className="space-y-2 w-full">
                {initialSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <GradientSparkle className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.content ? (
                      message.role === "assistant" ? (
                        <MarkdownContent content={message.content} />
                      ) : (
                        message.content
                      )
                    ) : (
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          {/* Follow-up suggestions - show after AI has responded */}
          {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-3">
              {currentSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full transition-colors hover:opacity-80"
                  style={{ 
                    backgroundColor: '#decaed',
                    color: '#4a3d52'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-[80px] pr-12 resize-none"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI-powered insights about your projects
          </p>
          <p className="text-xs text-muted-foreground/70 text-center">
            AI can make mistakes. Verify results.
          </p>
        </div>
      </div>
    </>
  );
}
