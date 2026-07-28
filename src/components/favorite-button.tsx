"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/icons";
import {
  LIBRARY_EVENT,
  LIBRARY_KEY,
  loadLibrary,
  toggleFavorite,
} from "@/lib/library-storage";

type FavoriteButtonProps = {
  slug: string;
  compact?: boolean;
};

export function FavoriteButton({ slug, compact = false }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setFavorite(loadLibrary().favorites.includes(slug));
    const onStorage = (event: StorageEvent) => {
      if (event.key === LIBRARY_KEY) sync();
    };

    sync();
    window.addEventListener(LIBRARY_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LIBRARY_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug]);

  function handleToggle() {
    const next = toggleFavorite(slug);
    setFavorite(next.favorites.includes(slug));
  }

  return (
    <button
      className={`favorite-button ${favorite ? "is-favorite" : ""} ${compact ? "is-compact" : ""}`}
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={handleToggle}
    >
      <HeartIcon size={compact ? 16 : 19} fill={favorite ? "currentColor" : "none"} />
    </button>
  );
}
