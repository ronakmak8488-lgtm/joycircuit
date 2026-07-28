"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import type { Game } from "@/lib/types";

type SearchBoxProps = {
  compact?: boolean;
};

export function SearchBox({ compact = false }: SearchBoxProps) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (deferredQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/games?q=${encodeURIComponent(deferredQuery)}&limit=5`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        const payload = (await response.json()) as { games?: Game[] } | Game[];
        const games = Array.isArray(payload) ? payload : payload.games ?? [];
        setSuggestions(games.slice(0, 5));
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSuggestions([]);
      }
    }, 160);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [deferredQuery]);

  function submitSearch(value = query) {
    const next = value.trim();
    if (!next) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  function openGame(slug: string) {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    router.push(`/play/${slug}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const game = suggestions[activeIndex];
      openGame(game.slug);
    }
  }

  return (
    <form
      className={`search-box ${compact ? "search-box-compact" : ""}`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <SearchIcon className="search-icon" size={18} />
      <label className="sr-only" htmlFor={`${listId}-input`}>Search games</label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        maxLength={80}
        placeholder="Search games, genres or creators"
        value={query}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-keyshortcuts="Control+K Meta+K"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />
      <span className="search-shortcut" aria-hidden="true">Ctrl K</span>
      {open ? (
        <div className="search-suggestions" id={listId} role="listbox" aria-label="Game suggestions">
          {suggestions.length > 0 ? suggestions.map((game, index) => (
            <button
              id={`${listId}-${index}`}
              key={game.slug}
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => openGame(game.slug)}
            >
              <span>{game.title}</span>
              <small>{game.categories[0] ?? "Game"}</small>
            </button>
          )) : <p>No games found.</p>}
        </div>
      ) : null}
    </form>
  );
}
