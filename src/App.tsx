import "./App.css";

import { useEffect, useState } from "react";

import { Podcast } from "./types/podcast";
import axios from "axios";
import moment from "moment";

const defaultImage =
  "https://res.cloudinary.com/duyvjsf0v/image/upload/v1747400776/thumbnail_118691277_179046977069725_2224862497427294902_n_7f19471c25_715dbd1e55.jpg";

function App() {
  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  const getPodcasts = async () => {
    const response = await axios.get(`${STRAPI_URL}/api/podcasts?populate=*`);
    console.log(response.data.data);
    setPodcasts(response.data.data);
  };

  useEffect(() => {
    getPodcasts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">HEAD Media Design Podcasts</h1>
      <div>
        <h2 className="text-2xl font-semibold mb-6">Podcasts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <article
              key={podcast.id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <img
                className="w-full h-48 object-cover"
                src={podcast.cover?.url ?? defaultImage}
                alt={podcast.title}
                width={180}
                height={38}
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 text-gray-600">
                  {podcast.title}
                </h3>
                <p className="text-gray-600 mb-4">{podcast.description}</p>
                <audio className="m-auto mb-4" controls>
                  <source src={podcast.audio.url} />
                  Your browser does not support the audio.
                </audio>
                <p className="text-sm text-gray-500">
                  Published: {moment(podcast.publishedAt).format("DD/MM/YYYY")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
