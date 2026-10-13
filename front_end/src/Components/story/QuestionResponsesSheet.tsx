import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getQuestionResponses, type QuestionResponse } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "react-i18next";

interface Props {
  storyId: string;
  overlayId: string;
  prompt: string;
  onClose: () => void;
}

export default function QuestionResponsesSheet({ storyId, overlayId, prompt, onClose }: Props) {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuestionResponses(storyId, overlayId)
      .then(setResponses)
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
  }, [storyId, overlayId]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-neutral-900 text-white rounded-t-2xl max-h-[80%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <span className="font-semibold">{t("stories.responses")}</span>
            <p className="text-xs text-white/50 truncate max-w-[240px]">{prompt}</p>
          </div>
          <button onClick={onClose} aria-label={t("actions.close")}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="py-10 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          ) : responses.length === 0 ? (
            <p className="text-center text-sm text-white/50 py-10">{t("stories.noResponsesYet")}</p>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-2">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={r.user.avatar_url ?? undefined} />
                  <AvatarFallback>{r.user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-white/50">{r.user.username}</p>
                  <p className="text-sm break-words">{r.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
