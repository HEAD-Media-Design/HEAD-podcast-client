import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import { EPISODES } from "./data/episodes";
import PodcastPlayerView from "./PodcastPlayerView";

function App() {
  if (!EPISODES.length) {
    return <EmptyState />;
  }

  const firstSlug = EPISODES[0]!.slug;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={`/episode/${firstSlug}`} replace />}
        />
        <Route path="/episode/:slug" element={<PodcastPlayerView />} />
        <Route
          path="*"
          element={<Navigate to={`/episode/${firstSlug}`} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
