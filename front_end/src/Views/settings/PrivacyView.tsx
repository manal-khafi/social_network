import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { unblockUser, updatePrivacySettings } from '../../features/user/userSlice';
import api from '../../api/axios';
import { ArrowLeft, Lock, Eye, MessageCircle, UserX, Download, Clock, Trash2 } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Switch } from '../../Components/ui/switch';
import { Separator } from '../../Components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../Components/ui/radio-group';
import { Label } from '../../Components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../Components/ui/dialog';
import { toast } from 'sonner';


import { useTranslation } from 'react-i18next';

export default function PrivacyView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { blockedUsers } = useAppSelector((state) => state.user);
  const [showDataDialog, setShowDataDialog] = useState(false);
  // null until the saved value has been loaded
  const [readReceipts, setReadReceipts] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/privacy/me/privacy')
      .then((res) => {
        if (!cancelled) setReadReceipts(res.data.allow_read_receipts ?? true);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("privacy.failedToLoadPrivacySettings"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReadReceiptsChange = async (checked: boolean) => {
    const previous = readReceipts;
    setReadReceipts(checked);
    try {
      await dispatch(updatePrivacySettings({ allow_read_receipts: checked })).unwrap();
    } catch {
      setReadReceipts(previous);
      toast.error(t("privacy.failedToUpdateReadReceipts"));
    }
  };

  const handleUnblock = (userId: string, username: string) => {
    dispatch(unblockUser(userId));
    toast.success(t('privacy.unblockedUser', { username }));
  };

  const handleDownloadData = () => {
    toast.success(t("privacy.preparingYourDataDownload"));
    setShowDataDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("privacy.title")}</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Content Visibility */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t("privacy.contentVisibility")}
          </h2>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("privacy.whoCanSeeYourPosts")}</p>
            <RadioGroup defaultValue="followers">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="everyone" />
                <Label htmlFor="everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.everyone")}</p>
                  <p className="text-sm text-muted-foreground">{t("privacy.anyoneOnAnmougar")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="followers" />
                <Label htmlFor="followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.followers")}</p>
                  <p className="text-sm text-muted-foreground">{t("privacy.onlyPeopleWhoFollowYou")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="mentioned" id="mentioned" />
                <Label htmlFor="mentioned" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.mentionedOnly")}</p>
                  <p className="text-sm text-muted-foreground">{t("privacy.onlyPeopleYouMention")}</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("privacy.whoCanSeeYourStories")}</p>
            <RadioGroup defaultValue="followers">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="stories-everyone" />
                <Label htmlFor="stories-everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.everyone")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="stories-followers" />
                <Label htmlFor="stories-followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.followers")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="close-friends" id="close-friends" />
                <Label htmlFor="close-friends" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.closeFriends")}</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("privacy.taggedPostsApproval")}</p>
              <p className="text-sm text-muted-foreground">{t("privacy.approvePostsYoureTaggedIn")}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </Card>

        {/* Interactions */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t("privacy.interactions")}
          </h2>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("privacy.whoCanContactYou")}</p>
            <RadioGroup defaultValue="everyone">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="contact-everyone" />
                <Label htmlFor="contact-everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.everyone")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="contact-followers" />
                <Label htmlFor="contact-followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.peopleIFollow")}</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="none" id="contact-none" />
                <Label htmlFor="contact-none" className="flex-1 cursor-pointer">
                  <p className="font-medium">{t("privacy.noOne")}</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("privacy.readReceipts")}</p>
              <p className="text-sm text-muted-foreground">{t("privacy.readReceiptsDescription")}</p>
            </div>
            <Switch
              checked={readReceipts ?? true}
              disabled={readReceipts === null}
              onCheckedChange={handleReadReceiptsChange}
              aria-label={t("privacy.readReceipts")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("privacy.commentFiltering")}</p>
              <p className="text-sm text-muted-foreground">{t("privacy.hidePotentiallyOffensiveComments")}</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("privacy.hideOffensiveWords")}</p>
              <p className="text-sm text-muted-foreground">{t("privacy.automaticallyFilterComments")}</p>
            </div>
            <Switch />
          </div>
        </Card>

        {/* Blocked & Muted */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <UserX className="w-5 h-5" />
            {t("privacy.blockedMutedAccounts")}
            {blockedUsers.length > 0 && (
              <span className="ms-auto text-sm text-muted-foreground">
                {blockedUsers.length}
              </span>
            )}
          </h2>

          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("privacy.noBlockedAccounts")}</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(user.id, user.username)}
                  >
                    {t("privacy.unblock")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <button className="w-full text-start p-3 hover:bg-muted rounded-lg transition-colors">
            <p className="font-medium">{t("privacy.mutedAccounts")}</p>
            <p className="text-sm text-muted-foreground">{t("privacy.0AccountsMuted")}</p>
          </button>
        </Card>

        {/* Data & History */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t("privacy.yourData")}
          </h2>

          <button
            onClick={() => setShowDataDialog(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div className="text-start">
                <p className="font-medium">{t("privacy.downloadYourData")}</p>
                <p className="text-sm text-muted-foreground">{t("privacy.requestACopyOfYourInformation")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="text-start">
                <p className="font-medium">{t("privacy.searchHistory")}</p>
                <p className="text-sm text-muted-foreground">{t("privacy.viewAndClearYourSearchHistory")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-muted-foreground" />
              <div className="text-start">
                <p className="font-medium">{t("privacy.clearCache")}</p>
                <p className="text-sm text-muted-foreground">{t("privacy.freeUpStorageSpace")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t("privacy.clear")}
            </Button>
          </button>
        </Card>
      </div>

      {/* Download Data Dialog */}
      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("privacy.downloadYourData")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              {t("privacy.wellPrepareACopyOfYour")}
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>{t("privacy.profileInformation")}</li>
              <li>{t("privacy.postsAndComments")}</li>
              <li>{t("privacy.messagesAndConversations")}</li>
              <li>{t("privacy.mediaFiles")}</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              {t("privacy.thisMayTakeUpTo48")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataDialog(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={handleDownloadData}
            >
              {t("privacy.requestDownload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
