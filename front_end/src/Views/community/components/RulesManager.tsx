import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import { Input } from "../../../Components/Community/communityInput";
import { Textarea } from "../../../Components/Community/communityTextArea";
import { EditRuleForm } from "./EditRuleForm";
import type { CommunityRule } from "../types";
import { useTranslation } from "react-i18next";

interface RulesManagerProps {
  rules: CommunityRule[];
  newRuleTitle: string;
  setNewRuleTitle: (value: string) => void;
  newRuleDescription: string;
  setNewRuleDescription: (value: string) => void;
  editingRuleId: string | null;
  setEditingRuleId: (ruleId: string | null) => void;
  handleAddRule: () => void;
  handleDeleteRule: (ruleId: string) => void;
  handleEditRule: (ruleId: string) => void;
  handleSaveRule: (ruleId: string, title: string, description: string) => void;
}

/** Admin tab: add, edit and delete community rules. */
export function RulesManager({
  rules,
  newRuleTitle,
  setNewRuleTitle,
  newRuleDescription,
  setNewRuleDescription,
  editingRuleId,
  setEditingRuleId,
  handleAddRule,
  handleDeleteRule,
  handleEditRule,
  handleSaveRule,
}: RulesManagerProps) {
  const { t } = useTranslation();
  return (
    <Card className="border-2">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            {t("communities.manageRulesCount", { n: rules.length })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("communities.defineAndManageYourCommunitysRules")}
          </p>
        </div>

        {/* Add New Rule Form */}
        <div className="mb-6 p-4 bg-muted rounded-lg border-2 border-border">
          <h4 className="font-semibold mb-3 text-primary dark:text-foreground">{t("communities.addANewRule")}</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                {t("communities.ruleTitle")}
              </label>
              <Input
                value={newRuleTitle}
                onChange={(e) => setNewRuleTitle(e.target.value)}
                placeholder={t("communities.eGRespect")}
                className="border-2 border-border focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                {t("communities.description2")}
              </label>
              <Textarea
                value={newRuleDescription}
                onChange={(e) => setNewRuleDescription(e.target.value)}
                placeholder={t("communities.describeTheRuleInDetail")}
                className="border-2 border-border focus:border-primary min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleAddRule}
              className="w-full bg-[#d6955b] hover:bg-[#c5844a] text-white"
              disabled={!newRuleTitle.trim() || !newRuleDescription.trim()}
            >
              <Plus className="h-4 w-4 me-2" />
              {t("communities.addRule")}
            </Button>
          </div>
        </div>

        {/* Rules List */}
        <ScrollArea className="h-[400px] pe-4">
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <Card key={rule.id} className="border-2 border-border hover:border-secondary dark:hover:border-primary transition-colors">
                <CardContent className="p-4">
                  {editingRuleId === rule.id ? (
                    <EditRuleForm
                      rule={rule}
                      onSave={handleSaveRule}
                      onCancel={() => setEditingRuleId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 break-words">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-foreground">{rule.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground ms-8">{rule.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRule(rule.id)}
                          className="border-2 border-secondary dark:border-primary text-primary dark:text-foreground hover:bg-muted"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="border-2 border-red-500 text-red-500 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
