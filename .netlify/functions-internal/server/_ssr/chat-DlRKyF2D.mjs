import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { a as Route$4, u as useAuth, A as Avatar, d as createNotification } from "./router-CUPGUMYq.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as uploadMedia } from "./upload-y4PVd49O.mjs";
import { i as MessageSquare, A as ArrowLeft, R as Reply, o as SmilePlus, P as Paperclip, X, m as Send } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
function ChatPage() {
  const {
    id: activeChatId
  } = Route$4.useSearch();
  const {
    user
  } = useAuth();
  const [chats, setChats] = reactExports.useState([]);
  const [messages, setMessages] = reactExports.useState([]);
  const [newMessage, setNewMessage] = reactExports.useState("");
  const [attachment, setAttachment] = reactExports.useState(null);
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [reactionsByMessage, setReactionsByMessage] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const scrollRef = reactExports.useRef(null);
  const messageIdSetRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const messageEls = reactExports.useRef({});
  const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢", "😡", "👍"];
  const loadChats = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("chat_participants").select(`
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
      `).eq("user_id", user.id).order("created_at", {
      ascending: false
    });
    if (error) return toast.error(error.message);
    const chatsWithOther = await Promise.all((data || []).map(async (item) => {
      const {
        data: otherPart
      } = await supabase.from("chat_participants").select("user:profiles!chat_participants_user_id_fkey(*)").eq("chat_id", item.chat.id).neq("user_id", user.id).single();
      return {
        ...item.chat,
        otherUser: otherPart?.user
      };
    }));
    setChats(chatsWithOther.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    setLoading(false);
  };
  const loadMessages = async (chatId) => {
    const {
      data,
      error
    } = await supabase.from("messages").select(`
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
      `).eq("chat_id", chatId).order("created_at", {
      ascending: true
    });
    if (error) return toast.error(error.message);
    const nextMessages = data || [];
    setMessages(nextMessages);
    messageIdSetRef.current = new Set(nextMessages.map((m) => m.id));
    if (nextMessages.length) {
      const {
        data: reactionsData
      } = await supabase.from("message_reactions").select("message_id, user_id, emoji").in("message_id", nextMessages.map((m) => m.id));
      const map = {};
      for (const r of reactionsData ?? []) {
        if (!map[r.message_id]) map[r.message_id] = {
          counts: {}
        };
        map[r.message_id].counts[r.emoji] = (map[r.message_id].counts[r.emoji] ?? 0) + 1;
        if (user && r.user_id === user.id) map[r.message_id].mine = r.emoji;
      }
      setReactionsByMessage(map);
    } else {
      setReactionsByMessage({});
    }
    setTimeout(() => scrollRef.current?.scrollIntoView({
      behavior: "smooth"
    }), 50);
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user || !activeChatId) return;
    const content = newMessage;
    const hasText = !!content.trim();
    const hasAttachment = !!attachment;
    if (!hasText && !hasAttachment) return;
    let media_url = null;
    let media_type = null;
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
      } catch (err) {
        return toast.error(err?.message || "Upload failed");
      }
    }
    setNewMessage("");
    setAttachment(null);
    const {
      error
    } = await supabase.from("messages").insert({
      chat_id: activeChatId,
      sender_id: user.id,
      content: hasText ? content : "",
      media_url,
      media_type,
      reply_to: replyTo?.id ?? null
    });
    if (error) {
      toast.error(error.message);
      setNewMessage(content);
      return;
    }
    setReplyTo(null);
    if (activeChat?.otherUser) {
      const preview = media_type === "image" ? "sent a photo" : media_type === "video" ? "sent a video" : content.trim().slice(0, 50) + (content.trim().length > 50 ? "..." : "");
      await createNotification({
        userId: activeChat.otherUser.id,
        actorId: user.id,
        type: "chat_message",
        entityId: activeChatId,
        entityType: "chat",
        body: preview || "sent you a message"
      });
    }
    loadMessages(activeChatId);
  };
  const setReaction = async (messageId, emoji) => {
    if (!user) return toast.error("Sign in first");
    const mine = reactionsByMessage[messageId]?.mine;
    if (mine === emoji) {
      const {
        error: error2
      } = await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", user.id);
      if (error2) toast.error(error2.message);
      return;
    }
    const {
      error
    } = await supabase.from("message_reactions").upsert({
      message_id: messageId,
      user_id: user.id,
      emoji
    }, {
      onConflict: "message_id,user_id"
    });
    if (error) toast.error(error.message);
  };
  const jumpToMessage = (messageId) => {
    const el = messageEls.current[messageId];
    if (el) el.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };
  reactExports.useEffect(() => {
    loadChats();
  }, [user?.id]);
  reactExports.useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
      const channel = supabase.channel(`chat:${activeChatId}`).on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${activeChatId}`
      }, () => {
        loadMessages(activeChatId);
      }).on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "message_reactions"
      }, (payload) => {
        const mid = payload?.new?.message_id ?? payload?.old?.message_id;
        if (mid && messageIdSetRef.current.has(mid)) loadMessages(activeChatId);
      }).subscribe();
      return () => {
        channel.unsubscribe();
      };
    }
  }, [activeChatId]);
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in" }) });
  const activeChat = chats.find((c) => c.id === activeChatId);
  const displayName = (profile) => profile?.display_name || profile?.username || "";
  const messageSummary = (m) => {
    if (!m) return "";
    if (m.media_type === "image") return "Photo";
    if (m.media_type === "video") return "Video";
    const text = String(m.content ?? "").trim();
    return text || "Message";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[100vh] overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${activeChatId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r-2 border-white bg-card shadow-[4px_0_0_0_#fff]`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b-2 border-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display font-black text-2xl uppercase tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-6 h-6" }),
        " Messages"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-2 space-y-2", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-muted-foreground font-mono text-xs uppercase animate-pulse", children: "loading_chats..." }) : chats.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card-flat p-4 bg-muted/20 border-white/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm uppercase", children: "No chats yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-mono mt-2 text-muted-foreground", children: "Accept a collab request to start building together." })
      ] }) }) : chats.map((chat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/chat", search: {
        id: chat.id
      }, className: `flex items-center gap-3 p-4 border-2 transition-all ${activeChatId === chat.id ? "border-white bg-primary text-primary-foreground shadow-[4px_4px_0_0_#fff] translate-x-[-2px] translate-y-[-2px]" : "border-transparent hover:border-white/30 hover:bg-white/5"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: chat.otherUser, size: 48 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-black rounded-none flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 bg-primary" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display font-bold truncate uppercase text-sm tracking-tight", children: chat.otherUser?.display_name || chat.otherUser?.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono opacity-70 truncate uppercase mt-0.5", children: chat.collab_request?.post?.title || "Direct Message" })
        ] })
      ] }, chat.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${activeChatId ? "flex" : "hidden md:flex"} flex-1 flex-col bg-background relative`, children: activeChatId && activeChat ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b-2 border-white bg-card flex items-center gap-4 sticky top-0 z-10 shadow-[0_4px_0_0_rgba(255,255,255,0.05)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/chat", search: {
          id: void 0
        }, className: "md:hidden brutal-btn p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: activeChat.otherUser, size: 44 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display font-black text-xl uppercase tracking-tight truncate", children: activeChat.otherUser?.display_name || activeChat.otherUser?.username }),
          activeChat.collab_request?.post?.title && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-primary font-bold uppercase flex items-center gap-1.5 mt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-primary animate-pulse" }),
            "Matched on: ",
            activeChat.collab_request.post.title
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [
        messages.map((msg, i) => {
          const isMe = msg.sender_id === user.id;
          const showAvatar = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
          const reaction = reactionsByMessage[msg.id];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: (el) => {
            messageEls.current[msg.id] = el;
          }, className: `flex ${isMe ? "justify-end" : "justify-start"} items-end gap-3`, children: [
            !isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 flex-shrink-0 mb-1", children: showAvatar && /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: msg.sender, size: 32 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `group relative max-w-[80%] md:max-w-[65%] border-2 p-4 ${isMe ? "bg-primary text-primary-foreground border-white shadow-[4px_4px_0_0_#fff]" : "bg-card text-foreground border-white shadow-[-4px_4px_0_0_#fff]"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `absolute -top-3 ${isMe ? "right-2" : "left-2"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setReplyTo(msg), className: "px-2 py-1 border-2 border-white bg-card text-foreground shadow-[2px_2px_0_0_#fff]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "px-2 py-1 border-2 border-white bg-card text-foreground shadow-[2px_2px_0_0_#fff]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SmilePlus, { className: "w-4 h-4" }) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContent, { align: isMe ? "end" : "start", side: "top", sideOffset: 8, className: "w-auto p-2 border-2 border-white bg-card shadow-[6px_6px_0_0_#fff] rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: EMOJIS.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setReaction(msg.id, e), className: `px-2 py-1 border-2 hover:bg-white/5 ${reaction?.mine === e ? "border-primary" : "border-white/20"}`, children: e }, e)) }) })
                ] })
              ] }),
              msg.reply && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => jumpToMessage(msg.reply.id), className: "w-full text-left border-2 border-white/30 bg-white/5 p-2 mb-3", children: [
                displayName(msg.reply.sender) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase opacity-80", children: displayName(msg.reply.sender) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs opacity-80 truncate", children: messageSummary(msg.reply) })
              ] }),
              msg.media_url && msg.media_type === "image" && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: msg.media_url, alt: "", className: "w-full max-w-sm border-2 border-white/20 mb-3" }),
              msg.media_url && msg.media_type === "video" && /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: msg.media_url, controls: true, className: "w-full max-w-sm border-2 border-white/20 mb-3" }),
              msg.content && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed whitespace-pre-wrap", children: msg.content }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-[9px] font-mono mt-2 uppercase opacity-60 ${isMe ? "text-right" : "text-left"}`, children: formatDistanceToNow(new Date(msg.created_at), {
                addSuffix: true
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 ${isMe ? "right-0" : "left-0"} w-2 h-2 border-b-2 border-white ${isMe ? "border-l-2" : "border-r-2"} opacity-20` })
            ] }),
            reaction?.counts && Object.keys(reaction.counts).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex gap-1 mt-2 ${isMe ? "justify-end" : "justify-start"}`, children: Object.entries(reaction.counts).map(([emoji, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setReaction(msg.id, emoji), className: `px-2 py-1 text-xs border-2 bg-card/80 shadow-[2px_2px_0_0_#fff] ${reaction.mine === emoji ? "border-primary" : "border-white/20"}`, children: [
              emoji,
              " ",
              count
            ] }, emoji)) })
          ] }, msg.id);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-card border-t-2 border-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: sendMessage, className: "flex gap-2 w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "brutal-btn brutal-btn-ghost px-3", title: "Attach photo/video", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*,video/*", hidden: true, onChange: (e) => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return;
            if (f.size > 20 * 1024 * 1024) return toast.error("Max file size is 20MB");
            setAttachment(f);
          } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          (replyTo || attachment) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-1 left-3 right-10 flex flex-col gap-0.5 pointer-events-none", children: [
            replyTo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono uppercase opacity-70 truncate", children: [
              displayName(replyTo.sender) ? `${displayName(replyTo.sender)}: ` : "",
              messageSummary(replyTo)
            ] }),
            attachment && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase opacity-70 truncate", children: attachment.name })
          ] }),
          (replyTo || attachment) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
            setReplyTo(null);
            setAttachment(null);
          }, className: "absolute top-1 right-1 p-1 border-2 border-white bg-card shadow-[2px_2px_0_0_#fff]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: newMessage, onChange: (e) => setNewMessage(e.target.value), placeholder: "Message...", className: `brutal-input font-mono text-xs py-2 ${replyTo || attachment ? "pt-6" : ""}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "brutal-btn px-6 group", disabled: !newMessage.trim() && !attachment, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black group-hover:translate-x-1 transition-transform inline-block", children: "Send" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4" })
        ] })
      ] }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-80", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card p-12 bg-card max-w-md border-white shadow-[12px_12px_0_0_var(--primary)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-primary/10 border-2 border-primary flex items-center justify-center mb-6 mx-auto rotate-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-10 h-10 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-display font-black text-foreground uppercase tracking-tighter", children: "Transmission Station" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm font-mono text-muted-foreground uppercase leading-relaxed", children: "Select a builder from the left console to establish a secure link." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 flex justify-center gap-2", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-primary/40 animate-pulse", style: {
        animationDelay: `${i * 0.2}s`
      } }, i)) })
    ] }) }) })
  ] });
}
export {
  ChatPage as component
};
