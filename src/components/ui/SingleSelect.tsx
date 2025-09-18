import React, { Fragment, useMemo, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/solid';

export interface SingleSelectOption {
  value: string;
  label: string;
  hint?: string; // optional right-side hint like usage %
}

interface SingleSelectProps {
  options: SingleSelectOption[];
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({ options, value, onChange, placeholder = 'Search…', className = '', label, disabled = false }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    return options.filter(o => tokens.every(t => (o.label || '').toLowerCase().includes(t)));
  }, [options, query]);

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <Combobox value={selected} onChange={(opt: SingleSelectOption | null) => onChange(opt ? opt.value : null)} disabled={disabled}>
        {() => (
          <div className="relative">
            <div className={`relative w-full cursor-text overflow-hidden rounded-md border bg-white text-left shadow-sm focus-within:border-gray-400 ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300'}`}>
              <Combobox.Input
                className={`w-full border-0 py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 outline-none placeholder-gray-400 ${disabled ? 'text-gray-400 bg-gray-50' : 'text-gray-900'}`}
                displayValue={(opt: SingleSelectOption) => opt?.label || ''}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selected ? selected.label : placeholder}
                disabled={disabled}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 focus:outline-none" disabled={disabled}>
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </Combobox.Button>
            </div>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                {filtered.length === 0 && (
                  <div className="relative cursor-default select-none px-3 py-2 text-gray-500">No results</div>
                )}
                {filtered.map((o) => (
                  <Combobox.Option key={o.value} className={({ active }) => `relative cursor-default select-none px-3 py-2 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`} value={o}>
                    {({ selected: isSel }) => (
                      <div className="flex items-center justify-between">
                        <div className="truncate flex items-center gap-2">
                          {isSel && <CheckIcon className="h-4 w-4 text-blue-600" />}
                          <span className="truncate">{o.label}</span>
                        </div>
                        {o.hint && <span className="text-xs text-gray-500 ml-2">{o.hint}</span>}
                      </div>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Transition>
          </div>
        )}
      </Combobox>
    </div>
  );
};

export default SingleSelect;


