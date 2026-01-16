import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Prices from "./pages/Prices";
import CamlyCoin from "./pages/CamlyCoin";
import AnhSang from "./pages/AnhSang";
import FunEcosystem from "./pages/FunEcosystem";
import NFTGallery from "./pages/NFTGallery";
import NFTCollectionDetail from "./pages/NFTCollectionDetail";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ViewModeProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Index />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/prices" element={<Prices />} />
                  <Route path="/ecosystem" element={<FunEcosystem />} />
                  <Route path="/camly" element={<CamlyCoin />} />
                  <Route path="/anh-sang" element={<AnhSang />} />
                  <Route path="/nft" element={<NFTGallery />} />
                  <Route path="/nft/collection/:id" element={<NFTCollectionDetail />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </ViewModeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
