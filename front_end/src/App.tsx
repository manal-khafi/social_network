import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Routes, Route, Navigate } from "react-router-dom";
import { store } from './store';
import { useAppSelector } from "./hooks";
import { useAuthSession } from "./hooks/useAuthSession";
import i18n from "./i18n/i18n";
import MainLayout from "./layouts/MainLayout";
import RequireAuth from './guards/RequireAuth';
import PersonalizeGuard from './guards/PersonalizeGuard';

// Views
import AuthView from "./Views/authentification";
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
import ArchivedPostsView from "./Views/ArchivedPostsView";
import LikedPostsView from "./Views/LikedPostsView";

// Settings Views
import SettingsView from "./Views/settings/SettingsView";
import AccountSettingsView from "./Views/settings/AccountSettingsView";
import NotificationsSettingsView from "./Views/settings/NotificationsView";
import PrivacyView from "./Views/settings/PrivacyView";
import AppearanceView from "./Views/settings/AppearanceView";
import BlockedContactsView from "./Views/settings/BlockedContactsView";
import LikedPostsSettingsView from "./Views/settings/LikedPostsSettingsView";
import ArchiveView from "./Views/settings/ArchiveView";
import ActivityView from './Views/settings/ActivityView';
import InteractionsView from './Views/settings/InteractionsView';
import ContentSharedView from './Views/settings/ContentSharedView';
import AccountHistoryView from './Views/settings/AccountHistoryView';
import InfoSupportView from './Views/settings/InfoSupportView';
import HelpView from './Views/settings/HelpView';
import PrivacyCenterView from './Views/settings/PrivacyCenterView';
import AboutView from './Views/settings/AboutView';

// Auth components
import VerifyEmail from './Components/Authentication/auth/verifyEmil';
import { ForgotPasswordScreen } from "./Components/Authentication/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./Components/Authentication/auth/resetPassword";


function AppContent() {
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
      <Route path="/" element={<AuthView />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen onBack={() => {}} />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      <Route element={<RequireAuth />}>
        <Route path="/personalize" element={<PersonalizeGuard />} />
        <Route path="/home" element={<MainLayout />}>
          <Route index element={<Navigate to="feed" replace />} />
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
          <Route path="settings">
            <Route index element={<SettingsView />} />
            <Route path="account" element={<AccountSettingsView />} />
            <Route path="notifications" element={<NotificationsSettingsView />} />
            <Route path="privacy" element={<PrivacyView />} />
            <Route path="appearance" element={<AppearanceView />} />
            <Route path="blocked-contacts" element={<BlockedContactsView />} />
            <Route path="liked-posts" element={<LikedPostsSettingsView />} />
            <Route path="archive">
              <Route index element={<ArchiveView />} />
              <Route path="chats" element={<ArchivedChatsView />} />
              <Route path="posts" element={<ArchivedPostsView />} />
            </Route>
            <Route path="activity">
              <Route index element={<ActivityView />} />
              <Route path="interactions" element={<InteractionsView />} />
              <Route path="content" element={<ContentSharedView />} />
              <Route path="history" element={<AccountHistoryView />} />
            </Route>
            <Route path="info">
              <Route index element={<InfoSupportView />} />
              <Route path="help" element={<HelpView />} />
              <Route path="privacy-center" element={<PrivacyCenterView />} />
              <Route path="about" element={<AboutView />} />
            </Route>
          </Route>
          <Route path="liked-posts" element={<LikedPostsView />} />
          <Route path="archived-posts" element={<ArchivedPostsView />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  const fontSize = useAppSelector((state) => state.textSize.fontSize);
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
  }, [fontSize]);

  // Accessibility class management
  const { highContrast, reducedMotion, screenReader, largerTouchTargets } = useAppSelector(
    (state) => state.accessibility
  );

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
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return <AppContent />;
}

function AppWrapper() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export default AppWrapper;
