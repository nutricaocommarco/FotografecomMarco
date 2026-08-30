import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';

export default function YouTubeLazy({ videoId, title }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="w-full h-full relative group bg-black">
      {showVideo ? (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      ) : (
        <div className="cursor-pointer w-full h-full flex items-center justify-center relative" onClick={() => setShowVideo(true)}>
          {/* A imagem carrega rápido e não pesa nada comparada ao player do YouTube */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <PlayCircle size={64} className="text-red-600 absolute drop-shadow-lg group-hover:scale-110 transition-transform" />
        </div>
      )}
    </div>
  );
}
