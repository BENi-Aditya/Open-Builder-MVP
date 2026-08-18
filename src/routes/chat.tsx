import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/AppShell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { Send, ArrowLeft, MessageSquare, Paperclip, X, Reply, SmilePlus } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/upload";
import { createNotification } from "@/lib/notifications";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  validateSearch: (s: Record<string, unknown>) => ({
    id: (s.id as string) || undefined,
  }),
});

function ChatPage() {
  const { id: activeChatId } = Route.useSearch();
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, { counts: Record<string, number>; mine?: string }>>({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdSetRef = useRef<Set<string>>(new Set());
  const messageEls = useRef<Record<string, HTMLDivElement | null>>({});
  const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢", "😡", "👍"];

  const loadChats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_participants")
      .select(`
        chat:chats (
          id,
          updated_at,
          collab_request:collab_requests!chats_collab_request_id_fkey (
            id,
            post:collab_posts (title)
          )
        ),
        user:profiles!chat_participants_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return toast.error(error.message);

    // For each chat, we need the OTHER participant
    const chatsWithOther = await Promise.all((data || []).map(async (item: any) => {
      const { data: otherPart } = await supabase
        .from("chat_participants")
        .select("user:profiles!chat_participants_user_id_fkey(*)")
        .eq("chat_id", item.chat.id)
        .neq("user_id", user.id)
        .single();
      
      return {
        ...item.chat,
        otherUser: otherPart?.user
      };
    }));

    setChats(chatsWithOther.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    setLoading(false);
  };

  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        media_url,
        media_type,
        reply_to,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url),
        reply:messages!reply_to(
          id,
          sender_id,
          content,
          media_url,
          media_type,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
        )
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) return toast.error(error.message);
    const nextMessages = data || [];
    setMessages(nextMessages);
    messageIdSetRef.current = new Set(nextMessages.map((m: any) => m.id));

    if (nextMessages.length) {
      const { data: reactionsData } = await supabase
        .from("message_reactions")
        .select("message_id, user_id, emoji")
        .in("message_id", nextMessages.map((m: any) => m.id));

      const map: Record<string, { counts: Record<string, number>; mine?: string }> = {};
      for (const r of reactionsData ?? []) {
        if (!map[r.message_id]) map[r.message_id] = { counts: {} };
        map[r.message_id].counts[r.emoji] = (map[r.message_id].counts[r.emoji] ?? 0) + 1;
        if (user && r.user_id === user.id) map[r.message_id].mine = r.emoji;
      }
      setReactionsByMessage(map);
    } else {
      setReactionsByMessage({});
    }

    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChatId) return;

    const content = newMessage;
    const hasText = !!content.trim();
    const hasAttachment = !!attachment;
    if (!hasText && !hasAttachment) return;

    let media_url: string | null = null;
    let media_type: string | null = null;

    if (attachment) {
      if (attachment.size > 20 * 1024 * 1024) {
        return toast.error("Max file size is 20MB");
      }
      if (!attachment.type.startsWith("image/") && !attachment.type.startsWith("video/")) {
        return toast.error("Only photos and videos are supported");
      }
      try {
        media_url = await uploadMedia(attachment, user.id, "messages");
        media_type = attachment.type.startsWith("video/") ? "video" : "image";
      } catch (err: any) {
        return toast.error(err?.message || "Upload failed");
      }
    }

    setNewMessage("");
    setAttachment(null);

    const { error } = await supabase.from("messages").insert({
      chat_id: activeChatId,
      sender_id: user.id,
      content: hasText ? content : "",
      media_url,
      media_type,
      reply_to: replyTo?.id ?? null,
    } as any);

    if (error) {
      toast.error(error.message);
      setNewMessage(content);
      return;
    }

    setReplyTo(null);

    if (activeChat?.otherUser) {
      const preview = media_type === "image"
        ? "sent a photo"
        : media_type === "video"
          ? "sent a video"
          : content.trim().slice(0, 50) + (content.trim().length > 50 ? "..." : "");

      await createNotification({
        userId: activeChat.otherUser.id,
        actorId: user.id,
        type: "chat_message",
        entityId: activeChatId,
        entityType: "chat",
        body: preview || "sent you a message",
      });
    }

    loadMessages(activeChatId);
  };

  const setReaction = async (messageId: string, emoji: string) => {
    if (!user) return toast.error("Sign in first");
    const mine = reactionsByMessage[messageId]?.mine;
    if (mine === emoji) {
      const { error } = await (supabase as any)
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id);
      if (error) toast.error(error.message);
      return;
    }
    const { error } = await (supabase as any)
      .from("message_reactions")
      .upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: "message_id,user_id" });
    if (error) toast.error(error.message);
  };

  const jumpToMessage = (messageId: string) => {
    const el = messageEls.current[messageId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    loadChats();
  }, [user?.id]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);

      const channel = supabase
        .channel(`chat:${activeChatId}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChatId}`
        }, () => {
          loadMessages(activeChatId);
        })
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "message_reactions",
        }, (payload: any) => {
          const mid = payload?.new?.message_id ?? payload?.old?.message_id;
          if (mid && messageIdSetRef.current.has(mid)) loadMessages(activeChatId);
        })
        .subscribe();

      return () => { channel.unsubscribe(); };
    }
  }, [activeChatId]);

  if (!user) return <div className="p-10 text-center"><Link to="/auth" className="brutal-btn">Sign in</Link></div>;

  const activeChat = chats.find(c => c.id === activeChatId);
  const displayName = (profile: any) => profile?.display_name || profile?.username || "";
  const messageSummary = (m: any) => {
    if (!m) return "";
    if (m.media_type === "image") return "Photo";
    if (m.media_type === "video") return "Video";
    const text = String(m.content ?? "").trim();
    return text || "Message";
  };

  return (
    <div className="flex h-[100vh] overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r-2 border-white bg-card shadow-[4px_0_0_0_#fff]`}>
        <div className="p-6 border-b-2 border-white">
          <h1 className="font-display font-black text-2xl uppercase tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Messages
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-xs uppercase animate-pulse">loading_chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <div className="brutal-card-flat p-4 bg-muted/20 border-white/20">
                <p className="font-bold text-sm uppercase">No chats yet</p>
                <p className="text-[10px] font-mono mt-2 text-muted-foreground">Accept a collab request to start building together.</p>
              </div>
            </div>
          ) : (
            chats.map(chat => (
              <Link
                key={chat.id}
                to="/chat"
                search={{ id: chat.id }}
                className={`flex items-center gap-3 p-4 border-2 transition-all ${
                  activeChatId === chat.id 
                    ? 'border-white bg-primary text-primary-foreground shadow-[4px_4px_0_0_#fff] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent hover:border-white/30 hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Avatar profile={chat.otherUser} size={48} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-black rounded-none flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold truncate uppercase text-sm tracking-tight">
                    {chat.otherUser?.display_name || chat.otherUser?.username}
                  </div>
                  <div className="text-[10px] font-mono opacity-70 truncate uppercase mt-0.5">
                    {chat.collab_request?.post?.title || 'Direct Message'}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background relative`}>
        {activeChatId && activeChat ? (          <>
            {/* Chat Header */}
            <div className="p-4 border-b-2 border-white bg-card flex items-center gap-4 sticky top-0 z-10 shadow-[0_4px_0_0_rgba(255,255,255,0.05)]">
              <Link to="/chat" search={{ id: undefined }} className="md:hidden brutal-btn p-2">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="relative">
                <Avatar profile={activeChat.otherUser} size={44} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-black text-xl uppercase tracking-tight truncate">
                  {activeChat.otherUser?.display_name || activeChat.otherUser?.username}
                </div>
                {activeChat.collab_request?.post?.title && (
                  <div className="text-[10px] font-mono text-primary font-bold uppercase flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-primary animate-pulse" />
                    Matched on: {activeChat.collab_request.post.title}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                const showAvatar = i === 0 || messages[i-1].sender_id !== msg.sender_id;
                const reaction = reactionsByMessage[msg.id];
                
                return (
                  <div
                    key={msg.id}
                    ref={(el) => { messageEls.current[msg.id] = el; }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-3`}
                  >
                    {!isMe && (
                      <div className="w-8 flex-shrink-0 mb-1">
                        {showAvatar && <Avatar profile={msg.sender} size={32} />}
                      </div>
                    )}
                    <div className={`group relative max-w-[80%] md:max-w-[65%] border-2 p-4 ${
                      isMe 
                        ? 'bg-primary text-primary-foreground border-white shadow-[4px_4px_0_0_#fff]' 
                        : 'bg-card text-foreground border-white shadow-[-4px_4px_0_0_#fff]'
                    }`}>
                      <div className={`absolute -top-3 ${isMe ? "right-2" : "left-2"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2`}>
                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          className="px-2 py-1 border-2 border-white bg-card text-foreground shadow-[2px_2px_0_0_#fff]"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="px-2 py-1 border-2 border-white bg-card text-foreground shadow-[2px_2px_0_0_#fff]"
                            >
                              <SmilePlus className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align={isMe ? "end" : "start"}
                            side="top"
                            sideOffset={8}
                            className="w-auto p-2 border-2 border-white bg-card shadow-[6px_6px_0_0_#fff] rounded-none"
                          >
                            <div className="flex items-center gap-1">
                              {EMOJIS.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => setReaction(msg.id, e)}
                                  className={`px-2 py-1 border-2 hover:bg-white/5 ${
                                    reaction?.mine === e ? "border-primary" : "border-white/20"
                                  }`}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {msg.reply && (
                        <button
                          type="button"
                          onClick={() => jumpToMessage(msg.reply.id)}
                          className="w-full text-left border-2 border-white/30 bg-white/5 p-2 mb-3"
                        >
                          {displayName(msg.reply.sender) && (
                            <div className="text-[10px] font-mono uppercase opacity-80">
                              {displayName(msg.reply.sender)}
                            </div>
                          )}
                          <div className="text-xs opacity-80 truncate">
                            {messageSummary(msg.reply)}
                          </div>
                        </button>
                      )}

                      {msg.media_url && msg.media_type === "image" && (
                        <img src={msg.media_url} alt="" className="w-full max-w-sm border-2 border-white/20 mb-3" />
                      )}
                      {msg.media_url && msg.media_type === "video" && (
                        <video src={msg.media_url} controls className="w-full max-w-sm border-2 border-white/20 mb-3" />
                      )}

                      {msg.content && <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                      <div className={`text-[9px] font-mono mt-2 uppercase opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </div>
                      
                      {/* Brutalist Corner Accent */}
                      <div className={`absolute top-0 ${isMe ? 'right-0' : 'left-0'} w-2 h-2 border-b-2 border-white ${isMe ? 'border-l-2' : 'border-r-2'} opacity-20`} />
                    </div>
                    {reaction?.counts && Object.keys(reaction.counts).length > 0 && (
                      <div className={`flex gap-1 mt-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {Object.entries(reaction.counts).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setReaction(msg.id, emoji)}
                            className={`px-2 py-1 text-xs border-2 bg-card/80 shadow-[2px_2px_0_0_#fff] ${
                              reaction.mine === emoji ? "border-primary" : "border-white/20"
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t-2 border-white">
              <form onSubmit={sendMessage} className="flex gap-2 w-full">
                <label className="brutal-btn brutal-btn-ghost px-3" title="Attach photo/video">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (!f) return;
                      if (f.size > 20 * 1024 * 1024) return toast.error("Max file size is 20MB");
                      setAttachment(f);
                    }}
                  />
                </label>
                <div className="relative flex-1">
                  {(replyTo || attachment) && (
                    <div className="absolute top-1 left-3 right-10 flex flex-col gap-0.5 pointer-events-none">
                      {replyTo && (
                        <div className="text-[10px] font-mono uppercase opacity-70 truncate">
                          {displayName(replyTo.sender) ? `${displayName(replyTo.sender)}: ` : ""}
                          {messageSummary(replyTo)}
                        </div>
                      )}
                      {attachment && (
                        <div className="text-[10px] font-mono uppercase opacity-70 truncate">
                          {attachment.name}
                        </div>
                      )}
                    </div>
                  )}
                  {(replyTo || attachment) && (
                    <button
                      type="button"
                      onClick={() => { setReplyTo(null); setAttachment(null); }}
                      className="absolute top-1 right-1 p-1 border-2 border-white bg-card shadow-[2px_2px_0_0_#fff]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message..."
                    className={`brutal-input font-mono text-xs py-2 ${replyTo || attachment ? "pt-6" : ""}`}
                  />
                </div>
                <button type="submit" className="brutal-btn px-6 group" disabled={!newMessage.trim() && !attachment}>
                  <span className="font-black group-hover:translate-x-1 transition-transform inline-block">Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-80">
            <div className="brutal-card p-12 bg-card max-w-md border-white shadow-[12px_12px_0_0_var(--primary)]">
              <div className="w-20 h-20 bg-primary/10 border-2 border-primary flex items-center justify-center mb-6 mx-auto rotate-3">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tighter">Transmission Station</h2>
              <p className="mt-4 text-sm font-mono text-muted-foreground uppercase leading-relaxed">
                Select a builder from the left console to establish a secure link.
              </p>
              <div className="mt-8 flex justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-2 h-2 bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
