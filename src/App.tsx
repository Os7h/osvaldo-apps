import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Lazy-loaded app entries
const Landing = lazy(() => import("@/pages/Landing"));
const GlasMeisterApp = lazy(() => import("@/apps/glasmeister"));
const WeltInventarApp = lazy(() => import("@/apps/weltinventar"));
const PourfectApp = lazy(() => import("@/apps/pourfect"));
const PickupApp = lazy(() => import("@/apps/pickup"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/glasmeister/*" element={<GlasMeisterApp />} />
            <Route path="/weltinventar/*" element={<WeltInventarApp />} />
            <Route path="/pourfect/*" element={<PourfectApp />} />
            <Route path="/pickup/*" element={<PickupApp />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
