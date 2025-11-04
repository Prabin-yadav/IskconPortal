import { Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";

import Home from "@/pages/Home";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Library from "@/pages/Library";
import PDFReader from "@/pages/PDFReader";
import Donate from "@/pages/Donate";
import Seva from "@/pages/Seva";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Dashboard from "@/pages/admin/Dashboard";
import AdminEvents from "@/pages/admin/Events";
import AdminDonations from "@/pages/admin/Donations";
import AdminLibrary from "@/pages/admin/Library";
import AdminUsers from "@/pages/admin/Users";
import AdminSeva from "@/pages/admin/Seva";
import UploadBookByLink from "@/pages/admin/UploadBookByLink";
import AdminEventVolunteers from "@/pages/admin/AdminEventVolunteers";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/library" element={<Library />} />
                <Route path="/library/:id" element={<PDFReader />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/seva" element={<Seva />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/events/:id" element={<AdminEventVolunteers />} />
                <Route path="/admin/donations" element={<AdminDonations />} />
                <Route path="/admin/library" element={<AdminLibrary />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/seva" element={<AdminSeva />} />
                <Route path="/admin/upload-link" element={<UploadBookByLink />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
