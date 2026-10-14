import { UserPlus, UserMinus, Users, TrendingUp, Hash } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Badge } from "../../../Components/Community/communityBadge";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../../Components/Community/communityAvatar";
import type { Community, Member } from "../types";
import { useTranslation } from "react-i18next";

interface CommunityInfoCardProps {
  community: Community;
  members: Member[];
  isJoined: boolean;
  handleJoinLeave: () => void;
}

/** Community avatar, name, category, member count and the join / leave button. */
export function CommunityInfoCard({
  community,
  members,
  isJoined,
  handleJoinLeave,
}: CommunityInfoCardProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 sm:mb-8">
      <Card className="border-2 shadow-xl">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-4 border-card shadow-lg flex-shrink-0">
                  <AvatarImage src={community.avatar_url} alt={community.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white text-2xl sm:text-3xl font-bold">
                    {community.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                    <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{community.name}</h1>
                    <Badge variant="secondary" className="bg-accent dark:bg-accent/20 text-primary dark:text-foreground border-accent dark:border-accent/30 text-xs">
                      <Hash className="h-3 w-3 me-1" />
                      {community.type || t("communities.noCategory")}
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-4 line-clamp-2 break-words [overflow-wrap:anywhere]">{community.bio || community.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="font-semibold text-foreground">
                        {t("communities.membersCount", { count: community._count?.members || members.length })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#d6955b]" />
                      <span className="font-semibold text-foreground">{t("communities.trending")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Join/Leave Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleJoinLeave}
                className={
                  isJoined
                    ? "h-7 sm:h-8 px-2.5 sm:px-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs"
                    : "h-7 sm:h-8 px-2.5 sm:px-3 bg-[#d6955b] hover:bg-[#c5844a] text-white text-xs"
                }
              >
                {isJoined ? (
                  <>
                    <UserMinus className="me-1 h-3 w-3" />
                    {t("communities.leave")}
                  </>
                ) : (
                  <>
                    <UserPlus className="me-1 h-3 w-3" />
                    {t("communities.join")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
