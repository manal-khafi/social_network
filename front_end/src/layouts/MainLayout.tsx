import { Outlet } from 'react-router-dom';
import BottomNav from '../Components/layout/BottomNav';
import Header from '../Components/layout/Header';
import DesktopSidebar from '../Components/layout/DesktopSidebar';
import { SkipToContent } from '../Components/accessibility/skipToContent';
import RealtimeProvider from '../realtime/RealtimeProvider';

export default function MainLayout() {
  return (
    <div className="relative min-h-screen lg:flex">
      <SkipToContent />
      {/* Sidebar: Part of flex row on desktop, hidden on mobile */}
      <DesktopSidebar />

      {/* Main Content: Takes remaining space */}
      <div className="flex-1 min-w-0">
        <Header />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-4 pb-24 lg:pb-4">
          <RealtimeProvider>
            <Outlet />
          </RealtimeProvider>
        </main>
      </div>

      {/* Mobile-only Bottom Nav */}
      <BottomNav />
    </div>
  );
}
