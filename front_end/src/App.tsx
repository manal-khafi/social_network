import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./hooks";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Views
import AuthView from "./Views/authentification";
import VerifyEmail from "./components/Authentification/auth/verifyEmil";
import { ForgotPasswordScreen } from "./components/Authentification/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./components/Authentification/auth/resetPassword";
import FeedView from "./Views/feed/FeedView";
import CreatePostView from "./Views/post/CreatePostView";
import StoryViewerView from "./Views/story/StoryViewerView";
import CommunityView from "./Views/community/CommunityView";
import InboxView from "./Views/inbox/InboxView";
import ChatView from "./Views/inbox/ChatView";
import ArchivedChatsView from "./Views/inbox/ArchivedChatsView";
import NotificationsView from "./Views/notifications/NotificationsView";
import MyProfileView from "./Views/profile/MyProfileView";
import UserProfileView from "./Views/profile/UserProfileView";
import FollowersView from "./Views/profile/FollowersView";
import EditProfileView from "./Views/profile/EditProfileView";
import SettingsView from "./Views/settings/SettingsView";
import AccountSettingsView from "./Views/settings/AccountSettingsView";
import NotificationsSettingsView from "./Views/settings/NotificationsView";
import PrivacyView from "./Views/settings/PrivacyView";
import AppearanceView from "./Views/settings/AppearanceView";
import ArchivedPostsView from "./Views/ArchivedPostsView";
import LikedPostsView from "./Views/LikedPostsView";

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/" element={<AuthView />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<FeedView />} />
            <Route path="feed" element={<FeedView />} />
            <Route path="create-post" element={<CreatePostView />} />
            <Route path="story/:storyId" element={<StoryViewerView />} />
            <Route path="community" element={<CommunityView />} />
            <Route path="inbox" element={<InboxView />} />
            <Route path="inbox/archived" element={<ArchivedChatsView />} />
            <Route path="inbox/:conversationId" element={<ChatView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="profile/me" element={<MyProfileView />} />
            <Route path="profile/edit" element={<EditProfileView />} />
            <Route path="profile/:userId" element={<UserProfileView />} />
            <Route path="profile/:userId/followers" element={<FollowersView type="followers" />} />
            <Route path="profile/:userId/following" element={<FollowersView type="following" />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="settings/account" element={<AccountSettingsView />} />
            <Route path="settings/notifications" element={<NotificationsSettingsView />} />
            <Route path="settings/privacy" element={<PrivacyView />} />
            <Route path="settings/appearance" element={<AppearanceView />} />
            <Route path="liked-posts" element={<LikedPostsView />} />
            <Route path="archived-posts" element={<ArchivedPostsView />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
