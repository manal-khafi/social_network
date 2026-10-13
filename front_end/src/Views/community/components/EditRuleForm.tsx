import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../Components/Community/communityButton";
import { Input } from "../../../Components/Community/communityInput";
import { Textarea } from "../../../Components/Community/communityTextArea";
import type { CommunityRule } from "../types";
import { useTranslation } from "react-i18next";

/** Inline form used by RulesManager to edit one rule. */
export function EditRuleForm({
  rule,
  onSave,
  onCancel
}: {
  rule: CommunityRule;
  onSave: (id: string, title: string, description: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t("communities.title2")}</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-2 border-border focus:border-primary"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t("communities.description2")}</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-2 border-border focus:border-primary min-h-[80px]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(rule.id, title, description)}
          className="flex-1 bg-primary hover:bg-secondary dark:hover:bg-primary/80 text-white"
          disabled={!title.trim() || !description.trim()}
        >
          <Check className="h-4 w-4 me-1" />
          {t("actions.save")}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2"
        >
          <X className="h-4 w-4 me-1" />
          {t("actions.cancel")}
        </Button>
      </div>
    </div>
  );
}
