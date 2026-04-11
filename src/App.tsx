import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import LoadingSpinner from "./components/LoadingSpinner";
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
      <Suspense fallback={<LoadingSpinner />}>
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
