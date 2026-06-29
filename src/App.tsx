import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Auth } from '@/pages/Auth';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Feed } from '@/pages/Feed';
import { Profile } from '@/pages/Profile';
import { Communities } from '@/pages/Communities';
import { Challenges } from '@/pages/Challenges';
import { Messages } from '@/pages/Messages';
import { Search } from '@/pages/Search';
import { Notifications } from '@/pages/Notifications';
import { Settings } from '@/pages/Settings';
import { CommunityFeed } from '@/pages/CommunityFeed';
import { SavedPosts } from '@/pages/SavedPosts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Feed />} />
                <Route path="search" element={<Search />} />
                <Route path="communities" element={<Communities />} />
                <Route path="communities/:id" element={<CommunityFeed />} />
                <Route path="challenges" element={<Challenges />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="saved" element={<SavedPosts />} />
                <Route path="profile/:username" element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            theme="system"
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
