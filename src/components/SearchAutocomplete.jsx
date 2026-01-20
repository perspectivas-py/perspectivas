import React, { useState, useRef } from "react";

const SearchAutocomplete = ({ onSubmit }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef();

  const fetchSuggestions = async (term) => {
    if (!term) return setSuggestions([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSuggestions(data.slice(0, 6));
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (onSubmit) onSubmit(suggestion);
    window.dispatchEvent(new CustomEvent("analytics", { detail: { event: "search_submit", query: suggestion } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(query);
    window.dispatchEvent(new CustomEvent("analytics", { detail: { event: "search_submit", query } }));
    setShowSuggestions(false);
  };

  return (
    <form className="search" role="search" aria-label="Buscar" onSubmit={handleSubmit} autoComplete="off">
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Buscar por tema, autor o dataset"
        aria-label="Buscar"
        value={query}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => handleSelect(s)}>{s}</li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default SearchAutocomplete;
