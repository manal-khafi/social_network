import { Users, Check, X } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../../Components/Community/communityAvatar";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import type { JoinRequest } from "../types";
import { useTranslation } from "react-i18next";

interface JoinRequestsSectionProps {
  joinRequests: JoinRequest[];
  handleApproveRequest: (requestId: string, userId: string) => void;
  handleRejectRequest: (requestId: string, userId: string) => void;
}

/** Admin tab: pending join requests with approve / reject actions. */
export function JoinRequestsSection({
  joinRequests,
  handleApproveRequest,
  handleRejectRequest,
}: JoinRequestsSectionProps) {
  const { t, i18n } = useTranslation();
  return (
    <Card className="border-2">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            {t("communities.joinRequestsCount", { n: joinRequests.length })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("communities.manageRequestsToJoinTheCommunity")}
          </p>
        </div>

        {joinRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p>{t("communities.noPendingRequests")}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pe-4">
            <div className="space-y-4">
              {joinRequests.map((request) => {
                const userName = request.user?.display_name || request.user?.username || t("communities.user");
                const userEmail = request.user?.email || "";
                const userAvatar = request.user?.avatar_url;
                const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase();

                return (
                  <Card key={request.id} className="border-2 border-border hover:border-secondary dark:hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 shrink-0 border-2 border-border">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 mb-1">
                              <h4 className="font-semibold text-foreground">
                                {userName}
                              </h4>
                              <span className="text-sm text-muted-foreground">@{request.user?.username}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {userEmail}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {t("communities.requestedOn", { date: new Date(request.created_at).toLocaleDateString(i18n.language) })}
                            </p>
                            {request.message && (
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                {request.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 sm:shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id, request.user_id)}
                            className="bg-primary hover:bg-secondary dark:hover:bg-primary/80 text-white"
                          >
                            <Check className="h-4 w-4 me-1" />
                            {t("communities.accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id, request.user_id)}
                            className="border-2 border-red-500 text-red-500 hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4 me-1" />
                            {t("communities.reject")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
