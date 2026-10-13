import { Users, TrendingUp, Hash } from "lucide-react";
import { TabsContent } from "../../../Components/Community/communityTabs";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import type { Community, CommunityRule, Member } from "../types";
import { useTranslation } from "react-i18next";

interface AboutTabProps {
  community: Community;
  members: Member[];
  rules: CommunityRule[];
}

/** "À propos" tab: description, stats and the community rules. */
export function AboutTab({
  community,
  members,
  rules,
}: AboutTabProps) {
  const { t, i18n } = useTranslation();
  return (
    <TabsContent value="about" className="mt-6">
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">{t("communities.aboutName", { name: community.name })}</h3>
              <p className="text-gray-600 leading-relaxed">{community.bio || community.description}</p>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">{t("communities.statistics")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-[#ecf8f6] to-white border-[#226d68]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-[#18534f]" />
                      <div>
                        <p className="text-2xl font-bold text-[#18534f]">
                          {(community._count?.members || members.length).toLocaleString()}
                        </p>
                        <p className="text-sm text-[#226d68]">{t("communities.members")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#feeaa1] to-white border-[#d6955b]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Hash className="h-8 w-8 text-[#18534f]" />
                      <div>
                        <p className="text-2xl font-bold text-[#18534f]">{community.type || t("communities.noCategory")}</p>
                        <p className="text-sm text-[#226d68]">{t("communities.category")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#ecf8f6] to-white border-[#d6955b]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-[#d6955b]" />
                      <div>
                        <p className="text-2xl font-bold text-[#18534f]">
                          {community.createdAt ? new Date(community.createdAt).toLocaleDateString(i18n.language) : "N/A"}
                        </p>
                        <p className="text-sm text-[#226d68]">{t("communities.createdOn")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">{t("communities.rules")}</h4>
              <ul className="space-y-2 text-gray-600">
                {rules.map((rule, index) => (
                  <li key={rule.id} className="flex items-start gap-2">
                    <span className="text-[#18534f] font-bold">{index + 1}.</span>
                    <span>{rule.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
