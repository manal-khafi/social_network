import { Suspense, lazy, useEffect } from "react";
import { Provider } from "react-redux";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { store } from "./store";
import { useAppSelector } from "./hooks";
import { useAuthSession } from "./hooks/useAuthSession";
import { useRealtime } from "./realtime/useRealtime";
import i18n from "./i18n/i18n";
import { DirectionProvider } from "@radix-ui/react-direction";
import MainLayout from "./layouts/MainLayout";
import RequireAuth from "./guards/RequireAuth";
import PersonalizeGuard from "./guards/PersonalizeGuard";

import PageLoader from "./Components/layout/PageLoader";

// Eager: the auth screens are the first thing a signed-out visitor needs, and
// the layout / guards wrap every other page.
import AuthView from "./Views/authentification";
import VerifyEmail from "./Components/Authentication/auth/verifyEmil";
import { ResetPasswordScreen } from "./Components/Authentication/auth/resetPassword";
import { useTranslation } from "react-i18next";

// Every other page is its own chunk, fetched the first time its route is opened.
const FeedView = lazy(() => import("./Views/feed/FeedView"));
const PostDetailView = lazy(() => import("./Views/post/PostDetailView"));
const CreatePostView = lazy(() => import("./Views/post/CreatePostView"));
const StoryViewerView = lazy(() => import("./Views/story/StoryViewerView"));
const HighlightViewerView = lazy(() => import("./Views/story/HighlightViewerView"));
const InboxView = lazy(() => import("./Views/inbox/InboxView"));
const ChatView = lazy(() => import("./Views/inbox/ChatView"));
const NotificationsView = lazy(() => import("./Views/notifications/NotificationsView"));
const SearchView = lazy(() => import("./Views/search/SearchView"));
const MyProfileView = lazy(() => import("./Views/profile/MyProfileView"));
const MyPostsView = lazy(() => import("./Views/profile/MyPostsView"));
const UserProfileView = lazy(() => import("./Views/profile/UserProfileView"));
const FollowersView = lazy(() => import("./Views/profile/FollowersView"));
const EditProfileView = lazy(() => import("./Views/profile/EditProfileView"));
const MyArchivedPostsView = lazy(() => import("./Views/archive/MyArchivedPostsView"));
const LikedPostsView = lazy(() => import("./Views/settings/LikedPostsView"));

// Settings
const SettingsView = lazy(() => import("./Views/settings/SettingsView"));
const AccountSettingsView = lazy(() => import("./Views/settings/AccountSettingsView"));
const NotificationsSettingsView = lazy(() => import("./Views/settings/NotificationsView"));
const PrivacyView = lazy(() => import("./Views/settings/PrivacyView"));
const AppearanceView = lazy(() => import("./Views/settings/AppearanceView"));
const BlockedContactsView = lazy(() => import("./Views/settings/BlockedContactsView"));
const CloseFriendsView = lazy(() => import("./Views/settings/CloseFriendsView"));
const LikedPostsSettingsView = lazy(() => import("./Views/settings/LikedPostsSettingsView"));
const InfoSupportView = lazy(() => import("./Views/settings/InfoSupportView"));
const HelpView = lazy(() => import("./Views/settings/HelpView"));
const PrivacyCenterView = lazy(() => import("./Views/settings/PrivacyCenterView"));
const AboutView = lazy(() => import("./Views/settings/AboutView"));
const ArchivedPostsView = lazy(() => import("./Views/settings/ArchivedPostsView"));

// Community (named exports)
const CommunityList = lazy(() =>
  import("./Views/community/communityList").then((m) => ({ default: m.CommunityList }))
);
const CommunityPageWrapper = lazy(() =>
  import("./Views/community/communityPage").then((m) => ({ default: m.CommunityPageWrapper }))
);
const CreateCommunity = lazy(() =>
  import("./Views/community/createCommunity").then((m) => ({ default: m.CreateCommunity }))
);

function AppContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSessionLoading } = useAuthSession();
  useRealtime();

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t("auth.loadingSession")}
      </div>
    );
  }

  return (
    // Fallback for lazily-loaded pages rendered outside MainLayout (which has
    // its own boundary so the sidebar and header stay visible while loading).
    <Suspense fallback={<PageLoader fullScreen />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<AuthView />} />
      {/* Same page as "/", opened on the forgot-password form */}
      <Route path="/forgot-password" element={<AuthView initialScreen="forgotPassword" />} />
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
          <Route path="post/:postId" element={<PostDetailView />} />
          <Route path="my-posts" element={<MyPostsView />} />
          <Route path="stories/:userId" element={<StoryViewerView />} />
          <Route path="story/:userId" element={<StoryViewerView />} />
          <Route path="highlights/:highlightId" element={<HighlightViewerView />} />

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
              <CreateCommunity />
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
            <Route path="close-friends" element={<CloseFriendsView />} />
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

      {/* Shared post link (Share > Copy link): https://<site>/post/<id> */}
      <Route path="/post/:postId" element={<PostLinkRedirect />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
    </Suspense>
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
  const dir = language === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  // Radix primitives (menus, tabs, sliders, switches...) read the direction from here.
  return (
    <DirectionProvider dir={dir}>
      <AppContent />
    </DirectionProvider>
  );
}

/** /post/:postId -> the post page inside the app (sign-in first if needed). */
function PostLinkRedirect() {
  const { postId } = useParams();
  return <Navigate to={postId ? `/home/post/${postId}` : "/home"} replace />;
}

export default function AppWrapper() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
