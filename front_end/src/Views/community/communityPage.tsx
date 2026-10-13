import { ArrowLeft, Users, Settings, Info, ShieldCheck } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../Components/Community/communityButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/Community/communityTabs";
import { useCommunityPage } from "./useCommunityPage";
import { CommunityBanner } from "./components/CommunityBanner";
import { CommunityInfoCard } from "./components/CommunityInfoCard";
import { JoinRequestDialog } from "./components/JoinRequestDialog";
import { MembersTab } from "./components/MembersTab";
import { AboutTab } from "./components/AboutTab";
import { JoinRequestsSection } from "./components/JoinRequestsSection";
import { RulesManager } from "./components/RulesManager";
import { SettingsTab } from "./components/SettingsTab";
import { useTranslation } from "react-i18next";

interface CommunityPageProps {
  communityId: string | number;
  onBack: () => void;
}

// Shell of the community page: data and actions come from useCommunityPage,
// each visual section lives in ./components.
export function CommunityPage({ communityId, onBack }: CommunityPageProps) {
  const { t } = useTranslation();
  const page = useCommunityPage(communityId);
  const { community } = page;

  if (page.loading) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <p className="text-gray-600">{t("communities.loadingCommunity")}</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("communities.notFound")}</p>
          <Button onClick={onBack} className="bg-[#d6955b] hover:bg-[#c5844a] text-white">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ecf8f6]">
      {/* Header with Banner */}
      <CommunityBanner community={community} />

      {/* Community Info */}
      <div className="px-3 sm:px-4 lg:px-8 py-8 ps-[70px] pe-[70px]">
        <CommunityInfoCard
          community={community}
          members={page.members}
          isJoined={page.isJoined}
          handleJoinLeave={page.handleJoinLeave}
        />

        {/* Join Request Dialog */}
        <JoinRequestDialog
          community={community}
          showJoinDialog={page.showJoinDialog}
          setShowJoinDialog={page.setShowJoinDialog}
          joinMessage={page.joinMessage}
          setJoinMessage={page.setJoinMessage}
          handleSubmitJoinRequest={page.handleSubmitJoinRequest}
        />

        {/* Tabs */}
        <Tabs defaultValue="members" className="pb-12">
          <TabsList className={`w-full h-11 sm:h-12 bg-white border-2 shadow-sm grid ${page.isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="members" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1 sm:me-2" />
              {t("communities.members")}
            </TabsTrigger>
            <TabsTrigger value="about" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1 sm:me-2" />
              {t("communities.about")}
            </TabsTrigger>
            {page.isAdmin && (
              <TabsTrigger value="admin" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1 sm:me-2" />
                {t("communities.admin")}
              </TabsTrigger>
            )}
            {page.isAdmin && (
              <TabsTrigger value="settings" className="h-9 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-[#18534f] data-[state=active]:text-white">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1 sm:me-2" />
                {t("nav.settings")}
              </TabsTrigger>
            )}
          </TabsList>


          {/* Members Tab */}
          <MembersTab members={page.members} />

          {/* About Tab */}
          <AboutTab
            community={community}
            members={page.members}
            rules={page.rules}
          />

          {/* Admin Tab */}
          {page.isAdmin && (
            <TabsContent value="admin" className="mt-6">
              <div className="space-y-6">
                {/* Join Requests Section */}
                <JoinRequestsSection
                  joinRequests={page.joinRequests}
                  handleApproveRequest={page.handleApproveRequest}
                  handleRejectRequest={page.handleRejectRequest}
                />

                {/* Community Rules Management Section */}
                <RulesManager
                  rules={page.rules}
                  newRuleTitle={page.newRuleTitle}
                  setNewRuleTitle={page.setNewRuleTitle}
                  newRuleDescription={page.newRuleDescription}
                  setNewRuleDescription={page.setNewRuleDescription}
                  editingRuleId={page.editingRuleId}
                  setEditingRuleId={page.setEditingRuleId}
                  handleAddRule={page.handleAddRule}
                  handleDeleteRule={page.handleDeleteRule}
                  handleEditRule={page.handleEditRule}
                  handleSaveRule={page.handleSaveRule}
                />
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <SettingsTab
            community={community}
            editName={page.editName}
            setEditName={page.setEditName}
            editDescription={page.editDescription}
            setEditDescription={page.setEditDescription}
            editCategory={page.editCategory}
            setEditCategory={page.setEditCategory}
            coverImagePreview={page.coverImagePreview}
            setCoverImagePreview={page.setCoverImagePreview}
            logoImagePreview={page.logoImagePreview}
            setLogoImagePreview={page.setLogoImagePreview}
            isPublic={page.isPublic}
            setIsPublic={page.setIsPublic}
            allowPosts={page.allowPosts}
            setAllowPosts={page.setAllowPosts}
            requireApproval={page.requireApproval}
            setRequireApproval={page.setRequireApproval}
            isSaving={page.isSaving}
            handleCoverImageChange={page.handleCoverImageChange}
            handleLogoImageChange={page.handleLogoImageChange}
            handleSaveSettings={page.handleSaveSettings}
          />
        </Tabs>
      </div>
    </div>
  );
}

// Wrapper component to read route params and provide a fallback back-navigation
export function CommunityPageWrapper({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation();
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();

  if (!communityId) {
    return (
      <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("communities.notFound")}</p>
          <Button onClick={() => navigate('/community/list')} className="bg-[#d6955b] hover:bg-[#c5844a] text-white">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("communities.backToCommunities")}
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return <CommunityPage communityId={communityId} onBack={handleBack} />;
}
