import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { toggleFollow, fetchFollowers, fetchFollowing } from "../../features/user/userSlice";
import { Card } from "../../Components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../Components/ui/avatar";
import { Button } from "../../Components/ui/button";
import { toast } from "sonner";

interface FollowersViewProps {
  type: "followers" | "following";
}

export default function FollowersView({ type }: FollowersViewProps) {
  const dispatch = useAppDispatch();
  const { userId } = useParams();
  const { followers, following } = useAppSelector((state) => state.user);
  const authUser = useAppSelector((state) => state.auth.user);
  const myUserId = authUser?.id;

  useEffect(() => {
    if (!userId) return;
    if (type === "followers") dispatch(fetchFollowers(userId));
    else dispatch(fetchFollowing(userId));
  }, [dispatch, type, userId]);

  const list = type === "followers" ? followers : following;

  const refreshList = () => {
    if (!userId) return;
    if (type === "followers") dispatch(fetchFollowers(userId));
    else dispatch(fetchFollowing(userId));
  };

  const handleToggleFollow = async (targetUserId: string, isPrivate: boolean) => {
    try {
      const result = await dispatch(toggleFollow(targetUserId)).unwrap();

      if (result.followRequestPending || (isPrivate && !result.isFollowing)) {
        toast.success("Follow request sent");
      } else if (result.isFollowing) {
        toast.success("Following user");
      } else {
        toast.success("Unfollowed user");
      }

      refreshList();
    } catch (e: any) {
      toast.error(typeof e === "string" ? e : "Failed to update follow");
    }
  };

  const getButtonLabel = (u: any) => {
    if (u.followRequestPending) return "Requested";
    if (u.isFollowing) return "Unfollow";
    return "Follow";
  };

  const isDisabled = (u: any) => !!u.followRequestPending;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {type === "followers" ? "Followers" : "Following"}
      </h2>

      <div className="space-y-2">
        {list.map((user) => {
          const isMe = myUserId && user.id === myUserId;
          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-3">
                <Link to={`/home/profile/${encodeURIComponent(user.id)}`}>
                  <Avatar>
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/home/profile/${encodeURIComponent(user.id)}`}>
                    <h3 className="font-semibold hover:underline">{user.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </Link>
                </div>

                {!isMe && (
                  <Button
                    size="sm"
                    variant={user.isFollowing ? "outline" : "default"}
                    className={!user.isFollowing ? "bg-[#d6955b] hover:bg-[#c58549]" : ""}
                    disabled={isDisabled(user)}
                    onClick={() => handleToggleFollow(user.id, !!user.is_private)}
                  >
                    {getButtonLabel(user)}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
