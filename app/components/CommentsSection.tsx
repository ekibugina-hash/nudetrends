"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { Comment } from "../types";

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("Anonymous");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch comments when videoId changes
  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.comments) {
          // The API already returns newest-first (new comments are unshifted).
          setComments(data.comments);
        }
      })
      .catch(() => setError("Failed to load comments."))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPosting(true);
    setError(null);

    const newComment: Comment = {
      id: `c-user-${Date.now()}`,
      videoId,
      author: authorName.trim() || "Anonymous",
      time: "Just now",
      text: commentText.trim(),
      avatarInitials: (authorName.trim() || "AN")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Could not post your comment. Try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-stone-750 pb-3">
        <MessageSquare className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">
          Comments
        </h3>
        <span className="ml-1 bg-stone-850 border border-stone-700 text-orange-400 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full shadow-sm">
          {comments.length}
        </span>
      </div>

      {/* Comment Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#151515] border border-stone-750 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl ring-1 ring-white/5"
      >
        {/* Author name input */}
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={40}
            className="flex-1 bg-black border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Comment textarea */}
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          maxLength={500}
          className="w-full bg-black border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-500 transition-colors resize-none leading-relaxed"
        />

        {/* Footer row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-stone-400 font-bold">
            {commentText.length}/500
          </span>
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-[10px] text-green-400 font-bold animate-fadeIn">
                ✓ Comment posted!
              </span>
            )}
            {error && (
              <span className="text-[10px] text-red-400 font-bold">{error}</span>
            )}
            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 text-xs font-black rounded-xl transition-colors shadow-lg shadow-orange-500/30"
            >
              {posting ? (
                <span className="w-3 h-3 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3 fill-current" />
              )}
              Post
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-stone-400">
            <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-stone-750 rounded-2xl bg-[#141414]">
            <MessageSquare className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <p className="text-xs text-stone-300 font-medium">No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 bg-[#151515] border border-stone-750 rounded-2xl p-4 hover:border-orange-500/50 transition-colors shadow-md ring-1 ring-white/5"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 text-xs font-black text-stone-950 shadow-md">
                {c.avatarInitials || "??"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white">
                    {c.author}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-stone-400">
                    <Clock className="w-3 h-3" />
                    {c.time}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed break-words">
                  {c.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
