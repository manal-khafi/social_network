import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { unblockUser } from '../../features/user/userSlice';
import { ArrowLeft, Lock, Eye, MessageCircle, UserX, Download, Clock, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function PrivacyView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { blockedUsers } = useAppSelector((state) => state.user);
  const [showDataDialog, setShowDataDialog] = useState(false);

  const handleUnblock = (userId: string, username: string) => {
    dispatch(unblockUser(userId));
    toast.success(`Unblocked @${username}`);
  };

  const handleDownloadData = () => {
    toast.success('Preparing your data download...');
    setShowDataDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Privacy & Safety</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Content Visibility */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Content Visibility
          </h2>

          <div className="space-y-3">
            <p className="text-sm font-medium">Who can see your posts</p>
            <RadioGroup defaultValue="followers">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="everyone" />
                <Label htmlFor="everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">Everyone</p>
                  <p className="text-sm text-muted-foreground">Anyone on ANMOUGAR</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="followers" />
                <Label htmlFor="followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">Followers</p>
                  <p className="text-sm text-muted-foreground">Only people who follow you</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="mentioned" id="mentioned" />
                <Label htmlFor="mentioned" className="flex-1 cursor-pointer">
                  <p className="font-medium">Mentioned Only</p>
                  <p className="text-sm text-muted-foreground">Only people you mention</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Who can see your stories</p>
            <RadioGroup defaultValue="followers">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="stories-everyone" />
                <Label htmlFor="stories-everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">Everyone</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="stories-followers" />
                <Label htmlFor="stories-followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">Followers</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="close-friends" id="close-friends" />
                <Label htmlFor="close-friends" className="flex-1 cursor-pointer">
                  <p className="font-medium">Close Friends</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tagged Posts Approval</p>
              <p className="text-sm text-muted-foreground">Approve posts you're tagged in</p>
            </div>
            <Switch defaultChecked />
          </div>
        </Card>

        {/* Interactions */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Interactions
          </h2>

          <div className="space-y-3">
            <p className="text-sm font-medium">Who can contact you</p>
            <RadioGroup defaultValue="everyone">
              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="everyone" id="contact-everyone" />
                <Label htmlFor="contact-everyone" className="flex-1 cursor-pointer">
                  <p className="font-medium">Everyone</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="followers" id="contact-followers" />
                <Label htmlFor="contact-followers" className="flex-1 cursor-pointer">
                  <p className="font-medium">People I Follow</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
                <RadioGroupItem value="none" id="contact-none" />
                <Label htmlFor="contact-none" className="flex-1 cursor-pointer">
                  <p className="font-medium">No One</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comment Filtering</p>
              <p className="text-sm text-muted-foreground">Hide potentially offensive comments</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Hide Offensive Words</p>
              <p className="text-sm text-muted-foreground">Automatically filter comments</p>
            </div>
            <Switch />
          </div>
        </Card>

        {/* Blocked & Muted */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked & Muted Accounts
            {blockedUsers.length > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {blockedUsers.length}
              </span>
            )}
          </h2>

          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked accounts</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(user.id, user.username)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <button className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors">
            <p className="font-medium">Muted Accounts</p>
            <p className="text-sm text-muted-foreground">0 accounts muted</p>
          </button>
        </Card>

        {/* Data & History */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Download className="w-5 h-5" />
            Your Data
          </h2>

          <button
            onClick={() => setShowDataDialog(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Download Your Data</p>
                <p className="text-sm text-muted-foreground">Request a copy of your information</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Search History</p>
                <p className="text-sm text-muted-foreground">View and clear your search history</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Clear Cache</p>
                <p className="text-sm text-muted-foreground">Free up storage space</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Clear
            </Button>
          </button>
        </Card>
      </div>

      {/* Download Data Dialog */}
      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Your Data</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              We'll prepare a copy of your ANMOUGAR data including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Profile information</li>
              <li>Posts and comments</li>
              <li>Messages and conversations</li>
              <li>Media files</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              This may take up to 48 hours. We'll notify you when it's ready.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#d6955b] hover:bg-[#c58549]"
              onClick={handleDownloadData}
            >
              Request Download
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
