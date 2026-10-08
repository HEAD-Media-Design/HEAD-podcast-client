import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import { EPISODES } from "./data/episodes";

const PodcastPlayerView = lazy(() => import("./PodcastPlayerView"));
const ErrorPage = lazy(() => import("./components/ErrorPage"));

function App() {
  if (!EPISODES.length) {
    return <EmptyState />;
  }

  const firstSlug = EPISODES[0]!.slug;

  return (
    <BrowserRouter>
      {/* Blank while the route chunk loads; the player shell has its own loading state. */}
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={`/episode/${firstSlug}`} replace />}
          />
          <Route path="/episode/:slug" element={<PodcastPlayerView />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
