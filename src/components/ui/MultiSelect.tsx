import React, { Fragment, useMemo, useRef, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/solid';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

// Searchable multi-select built on HeadlessUI Combobox
export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyText = 'No results',
  className = '',
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    // Tokenized contains: all tokens must appear in label for a match
    const tokens = q.split(/\s+/).filter(Boolean);
    return options.filter((o) => tokens.every(t => o.label.toLowerCase().includes(t)));
  }, [options, query]);

  const selectedOptions = useMemo(() => {
    // De-duplicate by value to avoid showing the same label multiple times
    const map = new Map<string, MultiSelectOption>();
    for (const o of options) {
      if (value.includes(o.value) && !map.has(o.value)) {
        map.set(o.value, o);
      }
    }
    return Array.from(map.values());
  }, [options, value]);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={`w-full ${className}`}>
      <Combobox 
        value={value} 
        onChange={() => {
          // Prevent default onChange behavior for multi-select
          // We handle selection in onMouseDown of individual options
        }} 
        multiple
      >
        {({ open }) => (
          <div className="relative">
            <div
              className="relative w-full cursor-text overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:outline-none focus-within:border-gray-400"
              onMouseDown={(e) => {
                // Clicking anywhere in the input area should open the options
                // If already open, let default behavior continue
                const target = e.target as HTMLElement;
                const clickedInsideInput = !!target.closest('input');
                if (clickedInsideInput) return; // allow input to receive focus/typing
                if (!open) {
                  e.preventDefault();
                  buttonRef.current?.click();
                }
              }}
            >
              <div className="flex min-h-[38px] flex-wrap items-center gap-1 py-1 pl-2 pr-8">
                {selectedOptions.slice(0, 3).map((o) => (
                  <span key={o.value} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 border border-blue-200">
                    {o.label}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onChange(value.filter((v) => v !== o.value));
                      }}
                      aria-label={`Remove ${o.label}`}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedOptions.length > 3 && (
                  <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">+{selectedOptions.length - 3} more</span>
                )}
                <Combobox.Input
                  className="flex-1 min-w-[6rem] border-0 py-1 text-sm leading-5 text-gray-900 focus:ring-0 outline-none placeholder-gray-400"
                  displayValue={() => ''}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => {
                    // Ensure dropdown opens when the input gains focus
                    if (!open) buttonRef.current?.click();
                  }}
                  onClick={() => {
                    if (!open) buttonRef.current?.click();
                  }}
                  placeholder={selectedOptions.length === 0 ? placeholder : ''}
                />
              </div>
              <Combobox.Button ref={buttonRef} className="absolute inset-y-0 right-0 flex items-center pr-2 focus:outline-none">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </Combobox.Button>
            </div>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
              {filtered.length === 0 && (
                <div className="relative cursor-default select-none px-3 py-2 text-gray-500">
                  {emptyText}
                </div>
              )}
              {filtered.map((o) => {
                const selected = value.includes(o.value);
                return (
                  <Combobox.Option
                    key={o.value}
                    className={({ active }) => `relative cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                    value={o.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const newValue = value.includes(o.value)
                        ? value.filter((v) => v !== o.value)
                        : [...value, o.value];
                      onChange(newValue);
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                        {selected && <CheckIcon className="h-3 w-3 text-white" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </div>
                  </Combobox.Option>
                );
              })}
              </Combobox.Options>
            </Transition>
          </div>
        )}
      </Combobox>
      {/* Summary now represented as chips inside the field */}
    </div>
  );
};

export default MultiSelect;


