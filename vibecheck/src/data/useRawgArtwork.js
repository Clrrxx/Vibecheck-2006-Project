import { useEffect, useState } from 'react';
import { createRawgArtworkClient } from './rawgArtwork';

const load = createRawgArtworkClient({
  key: import.meta.env.VITE_RAWG_KEY,
  storage: {
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
  },
});

export default function useRawgArtwork(game) {
  const appId = game?.appId;
  const name = game?.name;
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    load({ appId, name }).then(data => {
      if (active) setResult({ appId, name, data });
    }).catch(() => {
      if (active) setResult({ appId, name, data: null });
    });
    return () => { active = false; };
  }, [appId, name]);
  return result?.appId === appId && result?.name === name ? result.data : null;
}
