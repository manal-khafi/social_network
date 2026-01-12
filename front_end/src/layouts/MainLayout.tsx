import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from '../components/layout/BottomNav';
import Header from '../components/layout/Header';
import DesktopSidebar from '../components/layout/DesktopSidebar';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Header onMenuToggle={() => setIsSidebarOpen(true)} />
      <DesktopSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="mx-auto max-w-2xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}