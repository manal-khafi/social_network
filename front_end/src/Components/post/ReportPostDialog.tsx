import { useState } from "react";
import { toast } from "sonner";
import api from "../../api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const REASONS = [
  "Spam",
  "Nudity or sexual content",
  "Hate speech or symbols",
  "Violence or dangerous acts",
  "Harassment or bullying",
  "False information",
  "Scam or fraud",
  "Something else",
];

interface Props {
  postId: string;
  reportedUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportPostDialog({ postId, reportedUserId, open, onOpenChange }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/reports", {
        reason,
        description: description.trim() || undefined,
        reported_user_id: reportedUserId,
        post_id: postId,
      });
      toast.success("Thanks — we'll review this post");
      onOpenChange(false);
      setReason(null);
      setDescription("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Couldn't submit the report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report post</DialogTitle>
          <DialogDescription>Why are you reporting this post?</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left text-sm rounded-lg px-3 py-2 transition-colors ${
                reason === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details (optional)"
          maxLength={1000}
          className="min-h-[80px] resize-none"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!reason || submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
