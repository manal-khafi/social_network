import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../Components/Community/communityButton";
import { Input } from "../../../Components/Community/communityInput";
import { Textarea } from "../../../Components/Community/communityTextArea";
import type { CommunityRule } from "../types";

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
  const [title, setTitle] = useState(rule.title);
  const [description, setDescription] = useState(rule.description);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Titre</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-2 border-[#226d68]/30 focus:border-[#18534f]"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-2 border-[#226d68]/30 focus:border-[#18534f] min-h-[80px]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(rule.id, title, description)}
          className="flex-1 bg-[#18534f] hover:bg-[#226d68] text-white"
          disabled={!title.trim() || !description.trim()}
        >
          <Check className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2"
        >
          <X className="h-4 w-4 mr-1" />
          Annuler
        </Button>
      </div>
    </div>
  );
}
