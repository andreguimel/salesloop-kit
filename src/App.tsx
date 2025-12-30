import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SearchCompanies from "./pages/SearchCompanies";
import CompanyDetails from "./pages/CompanyDetails";
import History from "./pages/History";
import Reports from "./pages/Reports";
import CRM from "./pages/CRM";
import Settings from "./pages/Settings";
import Credits from "./pages/Credits";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="achei-leads-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/buscar" element={
                <ProtectedRoute>
                  <AppLayout>
                    <SearchCompanies />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/empresa/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompanyDetails />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/historico" element={
                <ProtectedRoute>
                  <AppLayout>
                    <History />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/crm" element={
                <ProtectedRoute>
                  <AppLayout>
                    <CRM />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/creditos" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Credits />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/termos-de-uso" element={
                <ProtectedRoute>
                  <AppLayout>
                    <TermosDeUso />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/politica-privacidade" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PoliticaPrivacidade />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
