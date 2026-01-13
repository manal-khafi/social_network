
import VerifyEmail from './Componenets/Authentification/auth/verifyEmil';
import RedirectByRole from './RedirectByRole';
import { Provider } from "react-redux";
import { store } from "./store";
import Home from "./Componenets/Home/home";
import {ForgotPasswordScreen}  from "./Componenets/Authentification/auth/ForgotPasswordScreen";
import {ResetPasswordScreen}  from "./Componenets/Authentification/auth/resetPassword";
// import SetupProfile from './Componenets/Acoount/nameandimage';
// import ChooseGender from './Componenets/Acoount/gender';
// import PrivacySettings from './Componenets/Acoount/Privacy';
import PersonalizationWizard from './Componenets/Acoount/Viexgenerale';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./hooks";
import MainLayout from "./layouts/MainLayout";
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
import SettingsView from "./Views/settings/SettingsView";
import AccountSettingsView from "./Views/settings/AccountSettingsView";
import NotificationsSettingsView from "./Views/settings/NotificationsView";
import PrivacyView from "./Views/settings/PrivacyView";
import AppearanceView from "./Views/settings/AppearanceView";
import ArchivedPostsView from "./Views/ArchivedPostsView";
import LikedPostsView from "./Views/LikedPostsView";



function App() {
  const handleBack = () => {
    console.log("Retour à la page précédente");
  };
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<AuthView />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen onBack={handleBack} />}/>
        <Route path="/personalization" element={<PersonalizationWizard />} />
        <Route path="/reset-password" 
            element={<ResetPasswordScreen onSwitchToLogin={() => window.location.href = '/'} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/redirect" element={<RedirectByRole />} />
        {/* <Route path="/personaliser/name&image" element={<SetupProfile />} /> */}
        <Route path="/home" element={<Home/>} />
        {/* <Route path="/personaliser/gender" element={<ChooseGender/>} />
        <Route path="/personaliser/privacy" element={<PrivacySettings/>} /> */}
        {!isAuthenticated ? (
        <>
          <Route path="/" element={<AuthView />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </>
      ) : (
        <>
          <Route path="/home" element={<MainLayout />}>
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
    </Provider>
  );


}
export default App;