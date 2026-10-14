import { Button } from "../../../Components/Community/communityButton";
import { Badge } from "../../../Components/Community/communityBadge";
import { TabsContent } from "../../../Components/Community/communityTabs";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../../Components/Community/communityAvatar";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import type { Member } from "../types";
import { useTranslation } from "react-i18next";

interface MembersTabProps {
  members: Member[];
}

/** "Membres" tab: the list of community members. */
export function MembersTab({
  members,
}: MembersTabProps) {
  const { t, i18n } = useTranslation();
  return (
    <TabsContent value="members" className="mt-6">
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              {t("communities.membersTitle", { n: members.length })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("communities.meetTheMembersOfThisCommunity")}
            </p>
          </div>

          <ScrollArea className="h-[500px] pe-4">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("communities.noMembersYet")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const userName = member.user?.display_name || member.user?.username || member.name || t("communities.user");
                  const initials = userName.substring(0, 2).toUpperCase();

                  return (
                    <Card key={member.id} className="group hover:shadow-md transition-all duration-300 hover:border-secondary dark:hover:border-primary">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 border-2 border-border group-hover:border-secondary dark:group-hover:border-primary transition-colors">
                              <AvatarImage src={member.user?.avatar_url || member.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className="font-semibold truncate text-foreground group-hover:text-primary dark:group-hover:text-foreground transition-colors">
                                  {userName}
                                </h4>
                                {member.role === 'ADMIN' && (
                                  <Badge variant="secondary" className="h-5 px-1.5 bg-accent dark:bg-accent/20 text-primary dark:text-foreground text-xs">
                                    {t("communities.admin")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{member.user?.username ? `@${member.user.username}` : member.username}</p>
                              {member.joinedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t("communities.memberSince", { date: new Date(member.joinedAt).toLocaleDateString(i18n.language) })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" className="border-2 border-secondary dark:border-primary text-primary dark:text-foreground hover:bg-muted hover:border-primary">
                            {t("profile.follow")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
