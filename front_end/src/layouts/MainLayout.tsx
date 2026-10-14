import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PageLoader from '../Components/layout/PageLoader';
import BottomNav from '../Components/layout/BottomNav';
import Header from '../Components/layout/Header';
import DesktopSidebar from '../Components/layout/DesktopSidebar';
import { SkipToContent } from '../Components/accessibility/skipToContent';
import { CallProvider } from '../features/call/CallProvider';
import CallLayer from '../Components/call/CallLayer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchCurrentUserProfile } from '../features/user/userSlice';

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasProfile = useAppSelector((state) => Boolean(state.user.currentUser));

  // The profile (avatar, display name...) used to be loaded only by a few pages,
  // so the feed, stories bar and sidebar showed no or an outdated avatar until
  // one of them had been visited.
  useEffect(() => {
    if (isAuthenticated && !hasProfile) dispatch(fetchCurrentUserProfile());
  }, [dispatch, isAuthenticated, hasProfile]);

  return (
    <CallProvider>
      <div className="relative min-h-screen lg:flex">
        <SkipToContent />
        {/* Sidebar: Part of flex row on desktop, hidden on mobile */}
        <DesktopSidebar />

        {/* Main Content: Takes remaining space */}
        <div className="flex-1 min-w-0 overflow-x-clip">
          <Header />
          {/* overflow-x-clip, not -hidden: clips without becoming a scroll
              container, so sticky headers inside the pages keep working. */}
          <main id="main-content" className="mx-auto max-w-2xl px-4 py-4 pb-24 lg:pb-4 overflow-x-clip">
            {/* Page chunks load here; the shell around them stays mounted. */}
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        {/* Mobile-only Bottom Nav */}
        <BottomNav />
      </div>

      <CallLayer />
    </CallProvider>
  );
}
