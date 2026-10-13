import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import { Input } from "../../../Components/Community/communityInput";
import { Textarea } from "../../../Components/Community/communityTextArea";
import { EditRuleForm } from "./EditRuleForm";
import type { CommunityRule } from "../types";

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
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            Manage rules ({rules.length})
          </h3>
          <p className="text-sm text-gray-600">
            Define and manage your community's rules
          </p>
        </div>

        {/* Add New Rule Form */}
        <div className="mb-6 p-4 bg-[#ecf8f6] rounded-lg border-2 border-[#226d68]/20">
          <h4 className="font-semibold mb-3 text-[#18534f]">Add a new rule</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Rule title
              </label>
              <Input
                value={newRuleTitle}
                onChange={(e) => setNewRuleTitle(e.target.value)}
                placeholder="e.g. Respect"
                className="border-2 border-[#226d68]/30 focus:border-[#18534f]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Description
              </label>
              <Textarea
                value={newRuleDescription}
                onChange={(e) => setNewRuleDescription(e.target.value)}
                placeholder="Describe the rule in detail..."
                className="border-2 border-[#226d68]/30 focus:border-[#18534f] min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleAddRule}
              className="w-full bg-[#d6955b] hover:bg-[#c5844a] text-white"
              disabled={!newRuleTitle.trim() || !newRuleDescription.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add rule
            </Button>
          </div>
        </div>

        {/* Rules List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <Card key={rule.id} className="border-2 border-[#226d68]/20 hover:border-[#226d68] transition-colors">
                <CardContent className="p-4">
                  {editingRuleId === rule.id ? (
                    <EditRuleForm
                      rule={rule}
                      onSave={handleSaveRule}
                      onCancel={() => setEditingRuleId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#18534f] text-white text-sm font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900">{rule.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 ml-8">{rule.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRule(rule.id)}
                          className="border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="border-2 border-red-500 text-red-500 hover:bg-red-50"
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
