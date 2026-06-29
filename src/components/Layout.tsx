import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import CreatePostModal from '@/components/CreatePostModal';
import { Plus } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile Create Post FAB */}
      {!isMessagesPage && (
        <div className="fixed bottom-20 right-4 z-50 md:hidden">
          <CreatePostModal
            triggerClassName="h-14 w-14 rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 flex items-center justify-center"
            triggerSize="icon"
            triggerChildren={<Plus className="h-6 w-6" />}
          />
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileSidebar />
    </div>
  );
}
