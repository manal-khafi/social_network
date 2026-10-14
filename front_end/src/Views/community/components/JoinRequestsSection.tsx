import { Users, Check, X } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../../Components/Community/communityAvatar";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import type { JoinRequest } from "../types";

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
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            Demandes d'adhésion ({joinRequests.length})
          </h3>
          <p className="text-sm text-gray-600">
            Gérez les demandes de rejoindre la communauté
          </p>
        </div>

        {joinRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande en attente</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {joinRequests.map((request) => {
                const userName = request.user?.display_name || request.user?.username || "Utilisateur";
                const userEmail = request.user?.email || "";
                const userAvatar = request.user?.avatar_url;
                const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase();

                return (
                  <Card key={request.id} className="border-2 border-[#226d68]/20 hover:border-[#226d68] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12 border-2 border-gray-200">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {userName}
                              </h4>
                              <span className="text-sm text-gray-500">@{request.user?.username}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {userEmail}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              Demande envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-600 bg-[#ecf8f6] p-3 rounded-lg">
                                {request.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id, request.user_id)}
                            className="bg-[#18534f] hover:bg-[#226d68] text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id, request.user_id)}
                            className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Refuser
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
