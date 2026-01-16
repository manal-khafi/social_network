import { Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";

/* ===================== AUTH ===================== */
import AuthView from "./Views/authentification";
import VerifyEmail from "./Componenets/Authentification/auth/verifyEmil";
import { ForgotPasswordScreen } from "./Componenets/Authentification/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./Componenets/Authentification/auth/resetPassword";
import RedirectByRole from "./RedirectByRole";

/* ===================== ONBOARDING ===================== */
import PersonalizationWizard from "./Componenets/Acoount/Viexgenerale";

/* ===================== LAYOUT ===================== */
import MainLayout from "./layouts/MainLayout";

/* ===================== FEED ===================== */
import FeedView from "./Views/feed/FeedView";
import CreatePostView from "./Views/post/CreatePostView";
import StoryViewerView from "./Views/story/StoryViewerView";

/* ===================== SOCIAL ===================== */
import CommunityView from "./Views/community/CommunityView";
import NotificationsView from "./Views/notifications/NotificationsView";

/* ===================== INBOX ===================== */
import InboxView from "./Views/inbox/InboxView";
import ChatView from "./Views/inbox/ChatView";
import ArchivedChatsView from "./Views/inbox/ArchivedChatsView";

/* ===================== PROFILE ===================== */
import MyProfileView from "./Views/profile/MyProfileView";
import UserProfileView from "./Views/profile/UserProfileView";
import FollowersView from "./Views/profile/FollowersView";
import EditProfileView from "./Views/profile/EditProfileView";

/* ===================== SETTINGS ===================== */
import SettingsView from "./Views/settings/SettingsView";
import AccountSettingsView from "./Views/settings/AccountSettingsView";
import NotificationsSettingsView from "./Views/settings/NotificationsView";
import PrivacyView from "./Views/settings/PrivacyView";
import AppearanceView from "./Views/settings/AppearanceView";

/* ===================== POSTS ===================== */
import ArchivedPostsView from "./Views/ArchivedPostsView";
import LikedPostsView from "./Views/LikedPostsView";

function App() {
  const handleBack = () => {
    console.log("Retour à la page précédente");
  };

  return (
    <Provider store={store}>
      <Routes>
        {/* ========== AUTH ROUTES ========== */}
        <Route path="/" element={<AuthView />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordScreen onBack={handleBack} />}
        />
        <Route
          path="/reset-password"
          element={
            <ResetPasswordScreen
              onSwitchToLogin={() => (window.location.href = "/")}
            />
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/redirect" element={<RedirectByRole />} />
        <Route path="/personalization" element={<PersonalizationWizard />} />
        <Route path="/home" element={<MainLayout />}>
          <Route index element={<FeedView />} />
          <Route path="feed" element={<FeedView />} />
          <Route path="create-post" element={<CreatePostView />} />
          <Route path="story/:storyId" element={<StoryViewerView />} />

          {/* Social */}
          <Route path="community" element={<CommunityView />} />
          <Route path="notifications" element={<NotificationsView />} />

          {/* Inbox */}
          <Route path="inbox" element={<InboxView />} />
          <Route path="inbox/archived" element={<ArchivedChatsView />} />
          <Route path="inbox/:conversationId" element={<ChatView />} />

          {/* Profile */}
          <Route path="profile/me" element={<MyProfileView />} />
          <Route path="profile/edit" element={<EditProfileView />} />
          <Route path="profile/:userId" element={<UserProfileView />} />
          <Route
            path="profile/:userId/followers"
            element={<FollowersView type="followers" />}
          />
          <Route
            path="profile/:userId/following"
            element={<FollowersView type="following" />}
          />

          {/* Settings */}
          <Route path="settings" element={<SettingsView />} />
          <Route path="settings/account" element={<AccountSettingsView />} />
          <Route
            path="settings/notifications"
            element={<NotificationsSettingsView />}
          />
          <Route path="settings/privacy" element={<PrivacyView />} />
          <Route path="settings/appearance" element={<AppearanceView />} />
          {/* Posts */}
          <Route path="liked-posts" element={<LikedPostsView />} />
          <Route path="archived-posts" element={<ArchivedPostsView />} />
        </Route>
      </Routes>
    </Provider>
  );
}

export default App;
