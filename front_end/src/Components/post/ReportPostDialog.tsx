import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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

// `value` is what the API stores (kept in English); `key` is the label shown.
const REASONS = [
  { value: "Spam", key: "spam" },
  { value: "Nudity or sexual content", key: "nudity" },
  { value: "Hate speech or symbols", key: "hate" },
  { value: "Violence or dangerous acts", key: "violence" },
  { value: "Harassment or bullying", key: "harassment" },
  { value: "False information", key: "falseInfo" },
  { value: "Scam or fraud", key: "scam" },
  { value: "Something else", key: "other" },
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
  const { t } = useTranslation();

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
      toast.success(t("posts.reportDialog.thanks"));
      onOpenChange(false);
      setReason(null);
      setDescription("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t("posts.reportDialog.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("posts.reportDialog.title")}</DialogTitle>
          <DialogDescription>{t("posts.reportDialog.prompt")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {REASONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReason(r.value)}
              className={`w-full text-start text-sm rounded-lg px-3 py-2 transition-colors ${
                reason === r.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {t(`posts.reportDialog.reasons.${r.key}`)}
            </button>
          ))}
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("posts.reportDialog.detailsPlaceholder")}
          maxLength={1000}
          className="min-h-[80px] resize-none"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={submit} disabled={!reason || submitting}>
            {submitting ? t("posts.reportDialog.submitting") : t("posts.reportDialog.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
