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
  return (
    <TabsContent value="settings" className="mt-6">
      <div className="space-y-4">
        {/* Informations de base */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#ecf8f6]">
                <Hash className="h-5 w-5 text-[#18534f]" />
              </div>
              <h3 className="font-semibold text-lg">Basic information</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm text-gray-700">Community name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your community name"
                  className="h-10 border-2 focus:border-[#226d68]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-sm text-gray-700">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe your community..."
                  rows={3}
                  className="border-2 focus:border-[#226d68] resize-none"
                />
                <p className="text-xs text-gray-500">{editDescription.length} characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-category" className="text-sm text-gray-700">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-10 border-2 focus:border-[#226d68]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
              <div className="p-2 rounded-lg bg-[#feeaa1]">
                <Palette className="h-5 w-5 text-[#18534f]" />
              </div>
              <h3 className="font-semibold text-lg">Appearance</h3>
            </div>

            <div className="space-y-4">
              {/* Image de couverture */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Cover image</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-full h-24 rounded-lg border-2 border-dashed border-[#226d68] bg-gray-50 overflow-hidden">
                      {coverImagePreview ? (
                        <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-[#226d68]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="cover-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] transition-colors text-[#18534f] text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Edit</span>
                    </Label>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Community logo</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#226d68] bg-gray-50 overflow-hidden flex items-center justify-center">
                      {logoImagePreview ? (
                        <img src={logoImagePreview} alt="Logo preview" className="w-full h-full object-cover" />
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
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#226d68] rounded-lg hover:bg-[#ecf8f6] transition-colors text-[#18534f] text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Edit</span>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 2MB)</p>
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
              <div className="p-2 rounded-lg bg-[#ecf8f6]">
                <Shield className="h-5 w-5 text-[#18534f]" />
              </div>
              <h3 className="font-semibold text-lg">Privacy & Settings</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-1">
                  <Label htmlFor="public-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Public community
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">Visible to all users</p>
                </div>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="data-[state=checked]:bg-[#18534f]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-1">
                  <Label htmlFor="posts-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Allow posts
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">Members can post content</p>
                </div>
                <Switch
                  id="posts-toggle"
                  checked={allowPosts}
                  onCheckedChange={setAllowPosts}
                  className="data-[state=checked]:bg-[#18534f]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-1">
                  <Label htmlFor="approval-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Approval required
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">Review posts before they are shown</p>
                </div>
                <Switch
                  id="approval-toggle"
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                  className="data-[state=checked]:bg-[#18534f]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu */}
        {(editName !== community.name || editDescription !== (community.bio || community.description)) && (
          <Card className="border-2 border-[#d6955b] bg-gradient-to-br from-[#feeaa1]/20 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[#feeaa1]">
                  <TrendingUp className="h-5 w-5 text-[#18534f]" />
                </div>
                <h3 className="font-semibold text-lg">Preview of changes</h3>
              </div>

              <Card className="border-2 border-[#226d68]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#18534f] to-[#226d68] flex items-center justify-center text-white text-xl font-bold shadow">
                      {editName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{editName}</h4>
                        <Badge variant="secondary" className="bg-[#feeaa1] text-[#18534f] text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {editCategory || "No category"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{editDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#226d68] p-4 z-50">
          <div className="max-w-7xl mx-auto flex gap-3 px-[70px]">
            <Button
              variant="outline"
              className="flex-1 h-11 border-2 border-[#226d68] text-[#18534f] hover:bg-[#ecf8f6]"
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
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex-1 h-11 bg-[#d6955b] hover:bg-[#c5844a] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
