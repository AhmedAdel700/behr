"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { Search } from "lucide-react";
import { MainInput } from "@/components/shared/MainInput";

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

export interface SearchInputProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch: (query: string) => void;
  debounceMs?: number;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  containerClassName?: string;
}

export function SearchInput({
  defaultValue = "",
  value,
  onChange,
  onSearch,
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  placeholder,
  disabled,
  name,
  id,
  containerClassName,
  "aria-label": ariaLabel,
}: SearchInputProps): ReactElement {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const inputValue = isControlled ? value : uncontrolledValue;
  const onSearchRef = useRef(onSearch);
  const lastEmittedRef = useRef(inputValue);

  onSearchRef.current = onSearch;

  useEffect(() => {
    if (inputValue === lastEmittedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastEmittedRef.current = inputValue;
      onSearchRef.current(inputValue);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inputValue, debounceMs]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.target.value;
    onChange?.(nextValue);
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
  };

  return (
    <MainInput
      type="search"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      startIcon={<Search />}
      aria-label={ariaLabel ?? placeholder}
      disabled={disabled}
      name={name}
      id={id}
      containerClassName={containerClassName}
    />
  );
}
