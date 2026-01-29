import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useAppDispatch } from "../../hooks";
import { toggleFollow } from "../../features/user/userSlice";
import api from "../../api/axios";
import { Input } from "../../Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";
import { Card } from "../../Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import { Button } from "../../Components/ui/button";
import { PATHS } from "../../routes/paths";
import { toast } from "sonner";

type SearchAccount = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_private: boolean;
  isFollowing: boolean;
  followRequestPending: boolean;
};

export default function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [accounts, setAccounts] = useState<SearchAccount[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const next = query.trim();
    if (!next) {
      setAccounts([]);
      setStatus("idle");
      setSearchParams({});
      return;
    }
    setSearchParams({ q: next });
  }, [query, setSearchParams]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    if (!q.trim()) return;

    const handle = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await api.get("/search/accounts", { params: { q } });
        setAccounts(res.data?.accounts ?? []);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchParams]);

  const topResults = useMemo(() => accounts.slice(0, 5), [accounts]);

  const handleToggleFollow = async (account: SearchAccount) => {
    try {
      const result: any = await dispatch(toggleFollow(account.id)).unwrap();

      // Support multiple possible backend shapes:
      const followStatus =
        result?.followStatus ??
        result?.data?.followStatus ??
        result?.status ?? // some backends return "pending/accepted"
        null;

      const isFollowing =
        typeof result?.isFollowing === "boolean"
          ? result.isFollowing
          : typeof result?.data?.isFollowing === "boolean"
            ? result.data.isFollowing
            : followStatus === "accepted";

      const followRequestPending =
        typeof result?.followRequestPending === "boolean"
          ? result.followRequestPending
          : typeof result?.data?.followRequestPending === "boolean"
            ? result.data.followRequestPending
            : followStatus === "pending";

      setAccounts((prev) =>
        prev.map((item) =>
          item.id === account.id
            ? { ...item, isFollowing, followRequestPending }
            : item
        )
      );

      if (followRequestPending) toast.success("Follow request sent");
      else if (isFollowing) toast.success("Following user");
      else toast.success("Unfollowed user");
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Failed to update follow");
    }
  };


  const getButtonLabel = (u: SearchAccount) => {
    if (u.followRequestPending) return "Cancel request";
    if (u.isFollowing) return "Unfollow";
    return "Follow";
  };


  const renderAccounts = (list: SearchAccount[], emptyText: string) => (
    <div className="space-y-2">
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyText}</p>
      ) : (
        list.map((account) => (
          <Card
              key={account.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition"
              onClick={() =>
                navigate(`/home/profile/${encodeURIComponent(account.username)}`)
              }
            >
            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() => navigate(`/home/profile/${encodeURIComponent(account.username)}`)}
                className="flex items-center gap-3 text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.avatar_url ?? undefined} />
                  <AvatarFallback>{account.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{account.display_name ?? account.username}</p>
                <p className="text-sm text-muted-foreground truncate">@{account.username}</p>
                {account.is_private && (
                  <span className="text-xs text-muted-foreground">Private account</span>
                )}
              </div>

              <Button
                size="sm"
                variant={account.isFollowing ? "outline" : "default"}
                className={!account.isFollowing ? "bg-[#d6955b] hover:bg-[#c58549]" : ""}
                disabled={false}
                onClick={() => handleToggleFollow(account)}
              >
                {getButtonLabel(account)}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts"
            className="h-10 rounded-full pl-9 bg-muted/60 border-none focus-visible:ring-0"
          />
        </div>
      </div>

      <Tabs defaultValue="top">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="top" className="flex-1">
            Top
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex-1">
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="pt-4">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground text-center py-8">Searching...</p>
          ) : status === "error" ? (
            <p className="text-sm text-destructive text-center py-8">Failed to search. Try again.</p>
          ) : (
            renderAccounts(topResults, "No top results yet")
          )}
        </TabsContent>

        <TabsContent value="accounts" className="pt-4">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground text-center py-8">Searching...</p>
          ) : status === "error" ? (
            <p className="text-sm text-destructive text-center py-8">Failed to search. Try again.</p>
          ) : (
            renderAccounts(accounts, "No accounts found")
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
