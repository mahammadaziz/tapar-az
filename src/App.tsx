import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Listings from '@/pages/Listings';
import ListingDetail from '@/pages/ListingDetail';
import CreateListing from '@/pages/CreateListing';
import AIListing from '@/pages/AIListing';
import Categories from '@/pages/Categories';
import Favorites from '@/pages/Favorites';
import Profile from '@/pages/Profile';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import NotFound from '@/pages/NotFound';
import Messages from '@/pages/Messages';
import Store from '@/pages/Store';
import CreateStore from '@/pages/CreateStore';
import Stores from '@/pages/Stores';
import AdminListings from '@/pages/AdminListings';
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminSettings from '@/pages/AdminSettings';
import { LanguageProvider } from '@/context/LanguageContext';
import PaymentSuccess from '@/pages/payment/PaymentSuccess';
import PaymentFailed from '@/pages/payment/PaymentFailed';
import PaymentResult from '@/pages/payment/PaymentResult';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/elanlar" element={<Listings />} />
              <Route path="/elanlar/:id" element={<ListingDetail />} />
              <Route path="/mesajlar" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/mesajlar/:listingId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/elan-yerlesdir" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="/magaza/:slug" element={<Store />} />
              <Route path="/magazalar" element={<Stores />} />
              <Route path="/magaza-yarat" element={<ProtectedRoute><CreateStore /></ProtectedRoute>} />
              <Route path="/ai-elan" element={<AIListing />} />
              <Route path="/kateqoriyalar" element={<Categories />} />
              <Route path="/favoriler" element={<Favorites />} />
              <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profil/elanlarim" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/elanlar" element={<AdminListings />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return location.pathname.startsWith('/admin')
    ? <AdminLayout>{children}</AdminLayout>
    : <Layout>{children}</Layout>;
}
