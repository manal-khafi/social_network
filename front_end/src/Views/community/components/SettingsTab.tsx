import { TrendingUp, Hash, Upload, Image as ImageIcon, Palette, Shield } from "lucide-react";
import { Button } from "../../../Components/Community/communityButton";
import { Badge } from "../../../Components/Community/communityBadge";
import { TabsContent } from "../../../Components/Community/communityTabs";
import { Card, CardContent } from "../../../Components/Community/communityCard";
import { Input } from "../../../Components/Community/communityInput";
import { Label } from "../../../Components/Community/communityLabel";
import { Textarea } from "../../../Components/Community/communityTextArea";
import { Switch } from "../../../Components/Community/communitySwitch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../Components/Community/communitySelect";
import type { Community } from "../types";
import { useTranslation } from "react-i18next";

interface SettingsTabProps {
  community: Community;
  editName: string;
  setEditName: (value: string) => void;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editCategory: string;
  setEditCategory: (value: string) => void;
  coverImagePreview: string;
  setCoverImagePreview: (value: string) => void;
  logoImagePreview: string;
  setLogoImagePreview: (value: string) => void;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  allowPosts: boolean;
  setAllowPosts: (value: boolean) => void;
  requireApproval: boolean;
  setRequireApproval: (value: boolean) => void;
  isSaving: boolean;
  handleCoverImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogoImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveSettings: () => void;
}

/** "Paramètres" tab: name, description, images, privacy options and the save action. */
export function SettingsTab({
  community,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editCategory,
  setEditCategory,
  coverImagePreview,
  setCoverImagePreview,
  logoImagePreview,
  setLogoImagePreview,
  isPublic,
  setIsPublic,
  allowPosts,
  setAllowPosts,
  requireApproval,
  setRequireApproval,
  isSaving,
  handleCoverImageChange,
  handleLogoImageChange,
  handleSaveSettings,
}: SettingsTabProps) {
  const { t } = useTranslation();
  return (
    <TabsContent value="settings" className="mt-6">
      <div className="space-y-4">
        {/* Informations de base */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <Hash className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t("communities.basicInformation")}</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm text-foreground">{t("communities.communityName")}</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("communities.yourCommunityName")}
                  className="h-10 border-2 focus:border-secondary dark:focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-sm text-foreground">{t("communities.description2")}</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t("communities.describeYourCommunity")}
                  rows={3}
                  className="border-2 focus:border-secondary dark:focus:border-primary resize-none"
                />
                <p className="text-xs text-muted-foreground">{t("communities.charactersCount", { n: editDescription.length })}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-category" className="text-sm text-foreground">{t("communities.category")}</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-10 border-2 focus:border-secondary dark:focus:border-primary">
                    <SelectValue placeholder={t("communities.selectACategory")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="tech">{t("communities.tech")}</SelectItem>
                    <SelectItem value="health">{t("communities.health")}</SelectItem>
                    <SelectItem value="education">{t("communities.education")}</SelectItem>
                    <SelectItem value="sports">{t("communities.sports")}</SelectItem>
                    <SelectItem value="entertainment">{t("communities.entertainment")}</SelectItem>
                    <SelectItem value="business">{t("communities.business")}</SelectItem>
                    <SelectItem value="arts">{t("communities.arts")}</SelectItem>
                    <SelectItem value="travel">{t("communities.travel")}</SelectItem>
                    <SelectItem value="food">{t("communities.food")}</SelectItem>
                    <SelectItem value="lifestyle">{t("communities.lifestyle")}</SelectItem>
                    <SelectItem value="other">{t("communities.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent dark:bg-accent/20">
                <Palette className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t("communities.appearance")}</h3>
            </div>

            <div className="space-y-4">
              {/* Image de couverture */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground">{t("communities.coverImage")}</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-full h-24 rounded-lg border-2 border-dashed border-secondary dark:border-primary bg-muted/50 overflow-hidden">
                      {coverImagePreview ? (
                        <img src={coverImagePreview} alt={t("communities.coverPreview")} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-secondary dark:text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="cover-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-card border-2 border-secondary dark:border-primary rounded-lg hover:bg-muted transition-colors text-primary dark:text-foreground text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{t("actions.edit")}</span>
                    </Label>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("communities.pngJpgMax5mb")}</p>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground">{t("communities.communityLogo")}</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-secondary dark:border-primary bg-muted/50 overflow-hidden flex items-center justify-center">
                      {logoImagePreview ? (
                        <img src={logoImagePreview} alt={t("communities.logoPreview")} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#18534f] to-[#226d68] flex items-center justify-center text-white text-2xl font-bold">
                          {editName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-card border-2 border-secondary dark:border-primary rounded-lg hover:bg-muted transition-colors text-primary dark:text-foreground text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{t("actions.edit")}</span>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("communities.pngJpgMax2mb")}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité & Paramètres */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t("communities.privacySettings")}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1">
                  <Label htmlFor="public-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    {t("communities.publicCommunity")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("communities.visibleToAllUsers")}</p>
                </div>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1">
                  <Label htmlFor="posts-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    {t("communities.allowPosts")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("communities.membersCanPostContent")}</p>
                </div>
                <Switch
                  id="posts-toggle"
                  checked={allowPosts}
                  onCheckedChange={setAllowPosts}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1">
                  <Label htmlFor="approval-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    {t("communities.approvalRequired")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("communities.reviewPostsBeforeTheyAreShown")}</p>
                </div>
                <Switch
                  id="approval-toggle"
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu */}
        {(editName !== community.name || editDescription !== (community.bio || community.description)) && (
          <Card className="border-2 border-[#d6955b] bg-gradient-to-br from-accent/20 to-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent dark:bg-accent/20">
                  <TrendingUp className="h-5 w-5 text-primary dark:text-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{t("communities.previewOfChanges")}</h3>
              </div>

              <Card className="border-2 border-secondary dark:border-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#18534f] to-[#226d68] flex items-center justify-center text-white text-xl font-bold shadow">
                      {editName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{editName}</h4>
                        <Badge variant="secondary" className="bg-accent dark:bg-accent/20 text-primary dark:text-foreground text-xs">
                          <Hash className="h-3 w-3 me-1" />
                          {editCategory || t("communities.noCategory")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{editDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="fixed bottom-0 start-0 end-0 bg-card border-t-2 border-secondary dark:border-primary p-4 z-50">
          <div className="max-w-7xl mx-auto flex gap-3 px-[70px]">
            <Button
              variant="outline"
              className="flex-1 h-11 border-2 border-secondary dark:border-primary text-primary dark:text-foreground hover:bg-muted"
              onClick={() => {
                if (community) {
                  setEditName(community.name || "");
                  setEditDescription(community.bio || community.description || "");
                  setEditCategory(community.type || "");
                }
                setCoverImagePreview("");
                setLogoImagePreview("");
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex-1 h-11 bg-[#d6955b] hover:bg-[#c5844a] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t("posts.saving") : t("actions.save")}
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
