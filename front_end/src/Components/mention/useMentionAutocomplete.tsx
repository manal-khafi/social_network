import { useEffect, useState } from "react";
import type { KeyboardEvent, RefObject, SyntheticEvent } from "react";
import { searchAccounts } from "../../api/storiesApi";
import type { StoryUser } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const MAX_RESULTS = 5;

type Field = HTMLInputElement | HTMLTextAreaElement;

interface Options {
  /** Where the list opens relative to the field. */
  placement?: "below" | "above";
  /** "dark" for the story composer (white on black). */
  theme?: "light" | "dark";
}

/**
 * @mention autocomplete for a controlled input / textarea. While the caret is
 * just after "@abc", a list of matching accounts (max 5) is shown; picking one
 * replaces "@abc" with "@username ". Arrow keys move, Enter / Tab pick,
 * Escape closes.
 *
 * Usage: pass the field's ref, put `onSelect`, `onBlur` and `onKeyDown` (via
 * handleKeyDown) on the field, wrap it in a `relative` element and render
 * `dropdown` next to it.
 */
export function useMentionAutocomplete<T extends Field>(
  ref: RefObject<T | null>,
  value: string,
  setValue: (next: string) => void,
  { placement = "below", theme = "light" }: Options = {}
) {
  const [query, setQuery] = useState<string | null>(null);
  const [start, setStart] = useState(0); // index of the "@"
  const [results, setResults] = useState<StoryUser[]>([]);
  const [active, setActive] = useState(0);

  /** Looks at the text before the caret for an "@abc" being typed. */
  const detect = (e?: SyntheticEvent<Field>) => {
    const el = (e?.currentTarget as Field | undefined) ?? ref.current;
    if (!el) return;
    const caret = el.selectionStart ?? el.value.length;
    const m = /(^|[^\w@])@([A-Za-z0-9_.]{0,30})$/.exec(el.value.slice(0, caret));
    if (m) {
      setQuery(m[2]);
      setStart(caret - m[2].length - 1);
    } else {
      setQuery(null);
    }
  };

  // Search as the user types (debounced); needs at least one character.
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchAccounts(query)
        .then((users) => {
          if (cancelled) return;
          setResults(users.slice(0, MAX_RESULTS));
          setActive(0);
        })
        .catch(() => !cancelled && setResults([]));
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const open = query !== null && results.length > 0;
  const close = () => {
    setQuery(null);
    setResults([]);
  };

  const pick = (user: StoryUser) => {
    const end = start + 1 + (query?.length ?? 0);
    const insert = `@${user.username} `;
    setValue(value.slice(0, start) + insert + value.slice(end));
    close();
    const caret = start + insert.length;
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(caret, caret);
    });
  };

  /** Call first in the field's onKeyDown; true means the key was used by the list. */
  const handleKeyDown = (e: KeyboardEvent<Field>): boolean => {
    if (!open) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(results[active]);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return true;
    }
    return false;
  };

  const dark = theme === "dark";
  const dropdown = open ? (
    <ul
      role="listbox"
      className={`absolute z-50 start-0 end-0 max-w-sm overflow-hidden rounded-xl border shadow-lg ${
        placement === "above" ? "bottom-full mb-1" : "top-full mt-1"
      } ${dark ? "bg-neutral-900 border-white/10 text-white" : "bg-popover text-popover-foreground border-border"}`}
    >
      {results.map((u, i) => (
        <li key={u.id} role="option" aria-selected={i === active}>
          <button
            type="button"
            // mousedown keeps the field focused (blur would close the list first)
            onMouseDown={(e) => {
              e.preventDefault();
              pick(u);
            }}
            onMouseEnter={() => setActive(i)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-start ${
              i === active ? (dark ? "bg-white/10" : "bg-muted") : ""
            }`}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className={dark ? "text-black" : ""}>{u.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block text-sm font-semibold truncate">@{u.username}</span>
              {u.display_name && (
                <span className={`block text-xs truncate ${dark ? "text-white/60" : "text-muted-foreground"}`}>
                  {u.display_name}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return {
    /** onSelect fires on typing and on caret moves: keeps the query current. */
    onSelect: detect,
    onBlur: () => window.setTimeout(close, 150),
    handleKeyDown,
    dropdown,
    isOpen: open,
  };
}
