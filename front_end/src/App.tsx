import { useEffect } from "react";
import { Provider } from "react-redux";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { store } from "./store";
import { useAppSelector } from "./hooks";
import { useAuthSession } from "./hooks/useAuthSession";
import i18n from "./i18n/i18n";
import MainLayout from "./layouts/MainLayout";
import RequireAuth from "./guards/RequireAuth";
import PersonalizeGuard from "./guards/PersonalizeGuard";

// Views
import AuthView from "./Views/authentification";
import FeedView from "./Views/feed/FeedView";
import CreatePostView from "./Views/post/CreatePostView";
import StoryViewerView from "./Views/story/StoryViewerView";
import InboxView from "./Views/inbox/InboxView";
import ChatView from "./Views/inbox/ChatView";
import NotificationsView from "./Views/notifications/NotificationsView";
import SearchView from "./Views/search/SearchView";
import MyProfileView from "./Views/profile/MyProfileView";
import MyPostsView from "./Views/profile/MyPostsView";
import UserProfileView from "./Views/profile/UserProfileView";
import FollowersView from "./Views/profile/FollowersView";
import EditProfileView from "./Views/profile/EditProfileView";
import MyArchivedPostsView from "./Views/archive/MyArchivedPostsView";
import LikedPostsView from "./Views/settings/LikedPostsView";

// Settings Views
import SettingsView from "./Views/settings/SettingsView";
import AccountSettingsView from "./Views/settings/AccountSettingsView";
import NotificationsSettingsView from "./Views/settings/NotificationsView";
import PrivacyView from "./Views/settings/PrivacyView";
import AppearanceView from "./Views/settings/AppearanceView";
import BlockedContactsView from "./Views/settings/BlockedContactsView";
import LikedPostsSettingsView from "./Views/settings/LikedPostsSettingsView";
import InfoSupportView from "./Views/settings/InfoSupportView";
import HelpView from "./Views/settings/HelpView";
import PrivacyCenterView from "./Views/settings/PrivacyCenterView";
import AboutView from "./Views/settings/AboutView";
import ArchivedPostsView from "./Views/settings/ArchivedPostsView";

// Auth components
import VerifyEmail from "./Components/Authentication/auth/verifyEmil";
import { ForgotPasswordScreen } from "./Components/Authentication/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./Components/Authentication/auth/resetPassword";

// Community
import { CommunityList } from "./Views/community/communityList";
import { CommunityPageWrapper } from "./Views/community/communityPage";
import { CreateCommunity } from "./Views/community/createCommunity";

function AppContent() {
  const navigate = useNavigate();
  const { isSessionLoading } = useAuthSession();

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<AuthView />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordScreen onBack={() => {}} />}
      />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected */}
      <Route element={<RequireAuth />}>
        <Route path="/personalize" element={<PersonalizeGuard />} />

        <Route path="/home" element={<MainLayout />}>
          <Route index element={<Navigate to="feed" replace />} />

          <Route path="feed" element={<FeedView />} />
          <Route path="search" element={<SearchView />} />
          <Route path="create-post" element={<CreatePostView />} />
          <Route path="my-posts" element={<MyPostsView />} />
          <Route path="story/:storyId" element={<StoryViewerView />} />

          <Route path="community" element={<Navigate to="list" replace />} />

          <Route
            path="community/list"
            element={
              <CommunityList
                onSelectCommunity={(id) => navigate(`/home/community/${id}`)}
                onCreateClick={() => navigate(`/home/community/create`)}
              />
            }
          />

          <Route
            path="community/:communityId"
            element={<CommunityPageWrapper onBack={() => navigate(-1)} />}
          />

          <Route
            path="community/create"
            element={
              <CreateCommunity
                onBack={() => navigate(-1)}
                onSubmit={(data) => console.log(data)}
              />
            }
          />

          <Route path="inbox" element={<InboxView />} />
          <Route path="inbox/:conversationId" element={<ChatView />} />
          <Route path="notifications" element={<NotificationsView />} />

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
          <Route path="settings">
            <Route index element={<SettingsView />} />
            <Route path="account" element={<AccountSettingsView />} />
            <Route path="notifications" element={<NotificationsSettingsView />} />
            <Route path="privacy" element={<PrivacyView />} />
            <Route path="appearance" element={<AppearanceView />} />
            <Route path="blocked-contacts" element={<BlockedContactsView />} />
            <Route path="liked-posts" element={<LikedPostsSettingsView />} />

            <Route path="archive">
              <Route index element={<Navigate to="posts" replace />} />
              <Route path="posts" element={<MyArchivedPostsView />} />
            </Route>

            <Route path="info">
              <Route index element={<InfoSupportView />} />
              <Route path="help" element={<HelpView />} />
              <Route path="privacy-center" element={<PrivacyCenterView />} />
              <Route path="about" element={<AboutView />} />
            </Route>
          </Route>

          {/* Extra pages */}
          <Route path="liked-posts" element={<LikedPostsView />} />
          <Route path="archived-posts" element={<ArchivedPostsView />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  const fontSize = useAppSelector((state) => state.textSize.fontSize);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-size", `${fontSize}px`);
  }, [fontSize]);

  const { highContrast, reducedMotion, screenReader, largerTouchTargets } =
    useAppSelector((state) => state.accessibility);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-contrast", highContrast);
    root.classList.toggle("a11y-reduced-motion", reducedMotion);
    root.classList.toggle("a11y-screen-reader", screenReader);
    root.classList.toggle("a11y-touch", largerTouchTargets);
  }, [highContrast, reducedMotion, screenReader, largerTouchTargets]);

  const { density } = useAppSelector((state) => state.layoutDensity);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("density-compact", "density-comfortable", "density-spacious");
    root.classList.add(`density-${density}`);
  }, [density]);

  const { language } = useAppSelector((state) => state.settings);
  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  return <AppContent />;
}

export default function AppWrapper() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
