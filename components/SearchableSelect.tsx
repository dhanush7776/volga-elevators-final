'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

type Option = { value: string; label: string };

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  required,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    (o.label || 'Untitled').toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Hidden input so native form 'required' validation still works */}
      <input tabIndex={-1} value={value ?? ''} required={required} onChange={() => {}} className="sr-only" />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field flex items-center justify-between text-left"
      >
        <span className={selected ? 'text-white' : 'text-white/30'}>
          {selected ? (selected.label || 'Untitled') : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/30" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-white/30">No matches</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-mint-400/10 hover:text-white"
              >
                <span>{opt.label || 'Untitled'}</span>
                {opt.value === value && <Check className="h-4 w-4 text-mint-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}