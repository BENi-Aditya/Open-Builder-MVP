import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { c as Route, u as useAuth, A as Avatar, d as createNotification } from "./router-DrZjJ8Fc.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as uploadMedia } from "./upload-y4PVd49O.mjs";
import { e as Heart, b as Bookmark, E as ExternalLink, Y as Youtube, G as Github, Z as Zap, h as MessageCircle, m as Send, T as Trash2 } from "../_libs/lucide-react.mjs";
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
function ProjectPage() {
  const {
    id
  } = Route.useParams();
  const {
    user,
    profile: me
  } = useAuth();
  const [project, setProject] = reactExports.useState(null);
  const [comments, setComments] = reactExports.useState([]);
  const [logs, setLogs] = reactExports.useState([]);
  const [comment, setComment] = reactExports.useState("");
  const [logBody, setLogBody] = reactExports.useState("");
  const [logFile, setLogFile] = reactExports.useState(null);
  const [liked, setLiked] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  const [commentLikes, setCommentLikes] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const load = async () => {
    setLoading(true);
    const {
      data
    } = await supabase.from("projects").select("*, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url, bio)").eq("id", id).maybeSingle();
    setProject(data);
    const [{
      data: cm
    }, {
      data: lg
    }] = await Promise.all([supabase.from("comments").select("id, body, created_at, user_id, like_count, user:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)").eq("project_id", id).order("created_at", {
      ascending: false
    }), supabase.from("build_logs").select("id, body, image_url, created_at, user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").eq("project_id", id).order("created_at", {
      ascending: false
    })]);
    setComments(cm ?? []);
    setLogs(lg ?? []);
    if (user) {
      const [{
        data: lk
      }, {
        data: sv
      }, {
        data: clk
      }] = await Promise.all([supabase.from("likes").select("user_id").eq("user_id", user.id).eq("project_id", id).maybeSingle(), supabase.from("saves").select("user_id").eq("user_id", user.id).eq("project_id", id).maybeSingle(), supabase.from("comment_likes").select("comment_id").eq("user_id", user.id)]);
      setLiked(!!lk);
      setSaved(!!sv);
      setCommentLikes(clk?.map((l) => l.comment_id) ?? []);
    }
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [id, user?.id]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center text-muted-foreground font-mono", children: "loading..." });
  if (!project) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl", children: "Project not found" }) });
  const toggleLike = async () => {
    if (!user) return toast.error("Sign in first");
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("project_id", id);
      setLiked(false);
      setProject((p) => ({
        ...p,
        like_count: Math.max(0, p.like_count - 1)
      }));
    } else {
      await supabase.from("likes").insert({
        user_id: user.id,
        project_id: id
      });
      setLiked(true);
      setProject((p) => ({
        ...p,
        like_count: p.like_count + 1
      }));
      await createNotification({
        userId: project.owner_id,
        actorId: user.id,
        type: "like",
        entityId: id,
        entityType: "project",
        body: `${user.user_metadata?.username || "Someone"} liked your project`
      });
    }
  };
  const toggleSave = async () => {
    if (!user) return toast.error("Sign in first");
    if (saved) {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("project_id", id);
      setSaved(false);
    } else {
      await supabase.from("saves").insert({
        user_id: user.id,
        project_id: id
      });
      setSaved(true);
    }
  };
  const toggleCommentLike = async (cid) => {
    if (!user) return toast.error("Sign in first");
    const isLiked = commentLikes.includes(cid);
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", cid);
      setCommentLikes((prev) => prev.filter((id2) => id2 !== cid));
      setComments((prev) => prev.map((c) => c.id === cid ? {
        ...c,
        like_count: Math.max(0, c.like_count - 1)
      } : c));
    } else {
      await supabase.from("comment_likes").insert({
        user_id: user.id,
        comment_id: cid
      });
      setCommentLikes((prev) => [...prev, cid]);
      setComments((prev) => prev.map((c) => c.id === cid ? {
        ...c,
        like_count: c.like_count + 1
      } : c));
    }
  };
  const addComment = async () => {
    if (!user || !comment.trim()) return;
    const {
      error
    } = await supabase.from("comments").insert({
      project_id: id,
      user_id: user.id,
      body: comment.trim()
    });
    if (error) return toast.error(error.message);
    await createNotification({
      userId: project.owner_id,
      actorId: user.id,
      type: "comment",
      entityId: id,
      entityType: "project",
      body: `${user.user_metadata?.username || "Someone"} commented on your project`
    });
    setComment("");
    load();
  };
  const addLog = async () => {
    if (!user || !logBody.trim()) return;
    let image_url = null;
    if (logFile) image_url = await uploadMedia(logFile, user.id, "logs");
    const {
      error
    } = await supabase.from("build_logs").insert({
      project_id: id,
      user_id: user.id,
      body: logBody.trim(),
      image_url
    });
    if (error) return toast.error(error.message);
    setLogBody("");
    setLogFile(null);
    load();
  };
  const deleteComment = async (cid) => {
    await supabase.from("comments").delete().eq("id", cid);
    load();
  };
  const isOwner = user?.id === project.owner_id;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-48 md:h-72 bg-ink border-b-2 border-white/10 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid-bg opacity-30" }),
      project.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: project.cover_url, alt: "", className: "w-full h-full object-cover opacity-60 grayscale-[20%]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 scan-noise opacity-15" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto px-4 md:px-8 -mt-16 relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card bg-card p-6 md:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [
          project.category && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill bg-primary text-primary-foreground border-primary", children: project.category }),
          project.tech_stack?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: t }, t))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl md:text-6xl leading-none", children: project.title }),
        project.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xl text-muted-foreground", children: project.tagline }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/u/$username", params: {
            username: project.owner.username
          }, className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: project.owner, size: 40 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: project.owner.display_name || project.owner.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground", children: [
                "@",
                project.owner.username
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: toggleLike, className: `brutal-btn ${liked ? "" : "brutal-btn-ghost"} text-xs`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-4 h-4", fill: liked ? "currentColor" : "none" }),
            " ",
            project.like_count
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleSave, className: `brutal-btn ${saved ? "" : "brutal-btn-ghost"} text-xs`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "w-4 h-4", fill: saved ? "currentColor" : "none" }) }),
          project.demo_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: project.demo_url, target: "_blank", rel: "noreferrer", className: "brutal-btn text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" }),
            " Live"
          ] }),
          project.youtube_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: project.youtube_url, target: "_blank", rel: "noreferrer", className: "brutal-btn brutal-btn-ghost text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Youtube, { className: "w-4 h-4" }),
            " Video"
          ] }),
          project.github_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: project.github_url, target: "_blank", rel: "noreferrer", className: "brutal-btn brutal-btn-ghost text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "w-4 h-4" }),
            " Code"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-3 gap-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          project.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "brutal-card-flat p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl mb-3", children: "README" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: project.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "brutal-card-flat p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display font-bold text-xl mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-5 h-5 text-[var(--tangerine)]" }),
              " Build timeline"
            ] }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 p-3 border-2 border-white/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: logBody, onChange: (e) => setLogBody(e.target.value), placeholder: "What did you ship today?", className: "brutal-input min-h-[60px]" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-mono cursor-pointer text-muted-foreground hover:text-primary", children: [
                  logFile ? `📎 ${logFile.name}` : "+ image",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", hidden: true, onChange: (e) => setLogFile(e.target.files?.[0] ?? null) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: addLog, className: "brutal-btn text-[10px] py-1.5", children: "Post update" })
              ] })
            ] }),
            logs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "No build logs yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-3 relative", children: logs.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "border-l-4 border-[var(--tangerine)] pl-4 py-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase text-muted-foreground", children: formatDistanceToNow(new Date(l.created_at), {
                addSuffix: true
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm whitespace-pre-wrap mt-1", children: l.body }),
              l.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: l.image_url, alt: "", className: "mt-2 w-full max-w-full border-2 border-white/20 object-cover max-h-72" })
            ] }, l.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "brutal-card-flat p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display font-bold text-xl mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-5 h-5" }),
              " Comments (",
              comments.length,
              ")"
            ] }),
            user ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: me, size: 32 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: comment, onChange: (e) => setComment(e.target.value), placeholder: "Drop a comment…", className: "brutal-input", onKeyDown: (e) => e.key === "Enter" && addComment() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: addComment, className: "brutal-btn", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4" }) })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "text-sm text-primary mb-4 block", children: "Sign in to comment →" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: comments.map((c) => {
              const isLiked = commentLikes.includes(c.id);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: c.user, size: 32 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/u/$username", params: {
                      username: c.user.username
                    }, className: "font-bold text-sm", children: c.user.display_name || c.user.username }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono text-muted-foreground", children: formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true
                    }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleCommentLike(c.id), className: `flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: `w-3 h-3 ${isLiked ? "fill-current" : ""}` }),
                        c.like_count > 0 && c.like_count
                      ] }),
                      (user?.id === c.user_id || isOwner) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteComment(c.id), className: "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" }) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-0.5", children: c.body })
                ] })
              ] }, c.id);
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card-flat p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold mb-3", children: "Stats" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm font-mono", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Likes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: project.like_count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Comments" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: project.comment_count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Logs" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: logs.length })
              ] })
            ] })
          ] }),
          project.owner.bio && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card-flat p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold mb-2", children: "About the builder" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: project.owner.bio })
          ] }),
          isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: async () => {
            if (!confirm("Delete this project?")) return;
            await supabase.from("projects").delete().eq("id", id);
            toast.success("Deleted");
            history.back();
          }, className: "brutal-btn brutal-btn-danger w-full justify-center text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" }),
            " Delete project"
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ProjectPage as component
};
