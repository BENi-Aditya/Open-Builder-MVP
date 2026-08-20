import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/AppShell";
import { formatDistanceToNow } from "date-fns";
import { Zap, Heart, MessageCircle, Send, Trash2, Edit2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";

export type BuildLog = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  project_id: string | null;
  like_count?: number;
  comment_count?: number;
  media?: Array<{ id: string; url: string; media_type: string; position: number }>;
  project?: { id: string; title: string } | null;
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null };
};

export function BuildLogCard({ log: initialLog, onDelete }: { log: BuildLog; onDelete?: () => void }) {
  const { user, profile: me } = useAuth();
  const [log, setLog] = useState(initialLog);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(log.body);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isOwner = user?.id === log.user.id;
  const createdAt = new Date(log.created_at);
  const now = new Date();
  const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const canEdit = isOwner && minutesSinceCreation <= 15;

  useEffect(() => {
    setLog(initialLog);
  }, [initialLog]);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, log.id, user?.id]);

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [log.id, user?.id]);

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("build_log_likes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("build_log_id", log.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const loadComments = async () => {
    const { data: cm } = await supabase
      .from("build_log_comments")
      .select("id, body, created_at, user_id, like_count, user:profiles!build_log_comments_user_id_fkey(id, username, display_name, avatar_url)")
      .eq("build_log_id", log.id)
      .order("created_at", { ascending: false });
    setComments(cm ?? []);

    if (user) {
      const { data: clk } = await supabase
        .from("build_log_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id);
      setCommentLikes(clk?.map(l => l.comment_id) ?? []);
    }
  };

  const toggleLike = async () => {
    if (!user) return toast.error("Sign in first");
    if (liked) {
      await supabase.from("build_log_likes").delete().eq("user_id", user.id).eq("build_log_id", log.id);
      setLiked(false);
      setLog(prev => ({ ...prev, like_count: Math.max(0, (prev.like_count ?? 0) - 1) }));
    } else {
      await supabase.from("build_log_likes").insert({ user_id: user.id, build_log_id: log.id });
      setLiked(true);
      setLog(prev => ({ ...prev, like_count: (prev.like_count ?? 0) + 1 }));
      await createNotification({
        userId: log.user.id,
        actorId: user.id,
        type: "like",
        entityId: log.id,
        entityType: "build_log",
        body: `${user.user_metadata?.username || "Someone"} liked your build log`,
      });
    }
  };

  const toggleCommentLike = async (cid: string) => {
    if (!user) return toast.error("Sign in first");
    const isLiked = commentLikes.includes(cid);
    if (isLiked) {
      await supabase.from("build_log_comment_likes").delete().eq("user_id", user.id).eq("comment_id", cid);
      setCommentLikes(prev => prev.filter(id => id !== cid));
      setComments(prev => prev.map(c => c.id === cid ? { ...c, like_count: Math.max(0, c.like_count - 1) } : c));
    } else {
      await supabase.from("build_log_comment_likes").insert({ user_id: user.id, comment_id: cid });
      setCommentLikes(prev => [...prev, cid]);
      setComments(prev => prev.map(c => c.id === cid ? { ...c, like_count: c.like_count + 1 } : c));
    }
  };

  const addComment = async () => {
    if (!user || !comment.trim()) return;
    const { error } = await supabase.from("build_log_comments").insert({
      build_log_id: log.id,
      user_id: user.id,
      body: comment.trim()
    });
    if (error) return toast.error(error.message);
    await createNotification({
      userId: log.user.id,
      actorId: user.id,
      type: "comment",
      entityId: log.id,
      entityType: "build_log",
      body: `${user.user_metadata?.username || "Someone"} commented on your build log`,
    });
    setComment("");
    setLog(prev => ({ ...prev, comment_count: (prev.comment_count ?? 0) + 1 }));
    loadComments();
  };

  const deleteComment = async (cid: string) => {
    await supabase.from("build_log_comments").delete().eq("id", cid);
    setLog(prev => ({ ...prev, comment_count: Math.max(0, (prev.comment_count ?? 0) - 1) }));
    loadComments();
  };

  const deleteBuildLog = async () => {
    if (!confirm("Delete this build log?")) return;
    const { error } = await supabase.from("build_logs").delete().eq("id", log.id);
    if (error) return toast.error(error.message);
    toast.success("Build log deleted");
    onDelete?.();
  };

  const saveEdit = async () => {
    if (!editBody.trim()) return;
    const { error } = await supabase.from("build_logs").update({ body: editBody.trim() }).eq("id", log.id);
    if (error) return toast.error(error.message);
    setLog(prev => ({ ...prev, body: editBody.trim() }));
    setIsEditing(false);
    toast.success("Build log updated");
  };

  const cancelEdit = () => {
    setEditBody(log.body);
    setIsEditing(false);
  };

  return (
    <article className="brutal-card-flat p-4 flex gap-3">
      <Avatar profile={log.user} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link to="/u/$username" params={{ username: log.user.username }} className="font-bold text-sm hover:text-primary">
            {log.user.display_name || log.user.username}
          </Link>
          <span className="text-xs font-mono text-muted-foreground">@{log.user.username}</span>
          <span className="text-[10px] font-mono uppercase text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[10px] font-mono uppercase text-[var(--tangerine)]">
          <Zap className="w-3 h-3" /> build log
          {log.project && (
            <>
              <span className="text-muted-foreground">·</span>
              <Link to="/p/$id" params={{ id: log.project.id }} className="hover:text-primary">{log.project.title}</Link>
            </>
          )}
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="brutal-input min-h-[80px] resize-y"
              maxLength={1000}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={saveEdit} className="brutal-btn text-xs py-1">Save</button>
              <button onClick={cancelEdit} className="brutal-btn brutal-btn-ghost text-xs py-1">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm whitespace-pre-wrap">{log.body}</p>
        )}

        {/* Display images with max height and click to preview */}
        {(log.media && log.media.length > 0) ? (
          <div className={`mt-3 grid gap-2 ${log.media.length === 1 ? 'grid-cols-1' : log.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {log.media.sort((a, b) => a.position - b.position).map((m) => (
              <div
                key={m.id}
                className="border-2 border-white/20 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setPreviewImage(m.url)}
              >
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-auto object-contain bg-black/5 max-h-64"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : log.image_url ? (
          <div
            className="mt-3 border-2 border-white/20 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setPreviewImage(log.image_url!)}
          >
            <img
              src={log.image_url}
              alt=""
              className="w-full h-auto object-contain bg-black/5 max-h-64"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 text-xs font-mono transition-colors ${
              liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {log.like_count || 0}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {log.comment_count || 0}
          </button>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors ml-auto"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
          {isOwner && (
            <button
              onClick={deleteBuildLog}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t-2 border-white/10 space-y-3">
            {user ? (
              <div className="flex gap-2">
                <Avatar profile={me} size={28} />
                <div className="flex-1 flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    className="brutal-input text-xs"
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />
                  <button onClick={addComment} className="brutal-btn text-xs py-1 px-2">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="text-xs text-primary">Sign in to comment →</Link>
            )}
            <div className="space-y-2">
              {comments.map((c) => {
                const isLiked = commentLikes.includes(c.id);
                return (
                  <div key={c.id} className="flex gap-2 group">
                    <Avatar profile={c.user} size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <Link to="/u/$username" params={{ username: c.user.username }} className="font-bold text-xs">
                          {c.user.display_name || c.user.username}
                        </Link>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => toggleCommentLike(c.id)}
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${
                              isLiked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            {c.like_count > 0 && c.like_count}
                          </button>
                          {user?.id === c.user_id && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs mt-0.5">{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 border-2 border-white/20 hover:border-white/40 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
