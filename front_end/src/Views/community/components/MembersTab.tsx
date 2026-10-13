import { Button } from "../../../Components/Community/communityButton";
import { Badge } from "../../../Components/Community/communityBadge";
import { TabsContent } from "../../../Components/Community/communityTabs";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Avatar, AvatarImage, AvatarFallback } from "../../../Components/Community/communityAvatar";
import { ScrollArea } from "../../../Components/Community/communityScrollArea";
import type { Member } from "../types";

interface MembersTabProps {
  members: Member[];
}

/** "Membres" tab: the list of community members. */
export function MembersTab({
  members,
}: MembersTabProps) {
  return (
    <TabsContent value="members" className="mt-6">
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Members ({members.length})
            </h3>
            <p className="text-sm text-gray-600">
              Meet the members of this community
            </p>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No members yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const userName = member.user?.display_name || member.user?.username || member.name || "User";
                  const initials = userName.substring(0, 2).toUpperCase();

                  return (
                    <Card key={member.id} className="group hover:shadow-md transition-all duration-300 hover:border-[#226d68]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 border-2 border-gray-200 group-hover:border-[#226d68] transition-colors">
                              <AvatarImage src={member.user?.avatar_url || member.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-[#18534f] to-[#226d68] text-white font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 group-hover:text-[#18534f] transition-colors">
                                  {userName}
                                </h4>
                                {member.role === 'ADMIN' && (
                                  <Badge variant="secondary" className="h-5 px-1.5 bg-[#feeaa1] text-[#18534f] text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.user?.username ? `@${member.user.username}` : member.username}</p>
                              {member.joinedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Member since {new Date(member.joinedAt).toLocaleDateString('en-US')}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" className="border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6] hover:border-[#18534f]">
                            Follow
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
