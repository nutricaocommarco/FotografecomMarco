import React from 'react';

export default function LocationMap() {
  return (
    <div className="rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 aspect-video">
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=-43.5067404%2C-23.0460447%2C-43.4947404%2C-23.0340447&layer=mapnik&marker=-23.0400447%2C-43.5007404"
        title="Mirante Ponta da Prainha — local das coberturas"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
      />
    </div>
  );
}
