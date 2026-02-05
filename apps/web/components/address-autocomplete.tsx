"use client";

import { useRef, useState, useEffect } from "react";

export type AddressSuggestion = {
  street: string;
  zip: string;
  city: string;
  display: string;
};

const MOCK_SUGGESTIONS: AddressSuggestion[] = [
  {
    street: "Skeppsbron 1",
    zip: "451 00",
    city: "Uddevalla",
    display: "Skeppsbron 1, 451 00 Uddevalla",
  },
  {
    street: "Storgatan 15",
    zip: "451 30",
    city: "Uddevalla",
    display: "Storgatan 15, 451 30 Uddevalla",
  },
  {
    street: "Havsvägen 8",
    zip: "453 00",
    city: "Lysekil",
    display: "Havsvägen 8, 453 00 Lysekil",
  },
  {
    street: "Kyrkogatan 4",
    zip: "462 30",
    city: "Vänersborg",
    display: "Kyrkogatan 4, 462 30 Vänersborg",
  },
  {
    street: "Kanalgatan 12",
    zip: "461 00",
    city: "Trollhättan",
    display: "Kanalgatan 12, 461 00 Trollhättan",
  },
  {
    street: "Villavägen 3",
    zip: "455 00",
    city: "Munkedal",
    display: "Villavägen 3, 455 00 Munkedal",
  },
];

function matchQuery(suggestion: AddressSuggestion, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    suggestion.display.toLowerCase().includes(q) ||
    suggestion.street.toLowerCase().includes(q) ||
    suggestion.zip.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
    suggestion.city.toLowerCase().includes(q)
  );
}

export type AddressAutocompleteProps = {
  id?: string;
  value?: string;
  onSelect: (address: { street: string; zip: string; city: string }) => void;
  className?: string;
};

export function AddressAutocomplete({
  id = "delivery-address",
  value: controlledValue,
  onSelect,
  className = "",
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(controlledValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = MOCK_SUGGESTIONS.filter((s) => matchQuery(s, inputValue));
  const showDropdown = isOpen && inputValue.length >= 0;

  useEffect(() => {
    if (controlledValue !== undefined) setInputValue(controlledValue);
  }, [controlledValue]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.display);
    setIsOpen(false);
    onSelect({
      street: suggestion.street,
      zip: suggestion.zip,
      city: suggestion.city,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Sök leveransadress
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder="Sök leveransadress..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        aria-expanded={showDropdown}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        role="combobox"
      />

      {showDropdown && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              Inga adresser hittades
            </li>
          ) : (
            filtered.map((suggestion, i) => (
              <li
                key={suggestion.display}
                role="option"
                aria-selected={i === highlightIndex}
                className={`cursor-pointer px-3 py-2.5 text-sm text-slate-800 transition ${
                  i === highlightIndex ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightIndex(i)}
              >
                {suggestion.display}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
