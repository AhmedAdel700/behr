"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useLocale } from "next-intl";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { DragEndEvent, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import { Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "@/styles/map-theme.css";
import { MainInput } from "@/components/shared/MainInput";
import {
  DEFAULT_BRANCH_LOCATION,
  formatBranchCoordinates,
  reverseGeocodeLocalizedAddress,
  searchBranchPlaces,
  type BranchMapLocation,
  type BranchPlaceSearchResult,
  type LocalizedAddressResolution,
} from "@/lib/admin/branchLocations";
import { cn } from "@/lib/utils";

const brandMarkerIcon = L.divIcon({
  className: "branch-map-marker",
  html: '<span class="branch-map-marker__pin" aria-hidden="true"><span class="branch-map-marker__dot"></span></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
  tooltipAnchor: [0, -36],
});

interface MapClickHandlerProps {
  onPick: (location: BranchMapLocation) => void;
}

function MapClickHandler({ onPick }: MapClickHandlerProps): null {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

interface MapResizeFixProps {
  active: boolean;
}

function MapResizeFix({ active }: MapResizeFixProps): null {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    const timers = [50, 200, 500].map((delay) =>
      window.setTimeout(() => {
        map.invalidateSize();
      }, delay),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [active, map]);

  return null;
}

interface MapCenterSyncProps {
  location: BranchMapLocation;
  zoom: number | null;
}

function MapCenterSync({ location, zoom }: MapCenterSyncProps): null {
  const map = useMap();

  useEffect(() => {
    const nextZoom = zoom ?? map.getZoom();
    map.setView([location.latitude, location.longitude], nextZoom, {
      animate: true,
    });
  }, [location.latitude, location.longitude, map, zoom]);

  return null;
}

export interface MapLocationPickerProps {
  value: BranchMapLocation | null;
  onChange?: (location: BranchMapLocation) => void;
  /** Called when a search result is chosen (includes place label). */
  onPlaceSelect?: (place: BranchPlaceSearchResult) => void;
  active?: boolean;
  readOnly?: boolean;
  label?: string;
  hint?: string;
  error?: string;
  /** Shown in the marker tooltip (e.g. street address). */
  address?: string;
  /** Optional tooltip heading (e.g. branch name). */
  title?: string;
  /** Called when a resolved/search address is available. */
  onResolvedAddress?: (address: LocalizedAddressResolution) => void;
  /** Label while reverse-geocoding the pin. */
  findingAddressLabel?: string;
  searchPlaceholder?: string;
  searchingLabel?: string;
  searchNoResultsLabel?: string;
  className?: string;
  mapClassName?: string;
}

export function MapLocationPicker({
  value,
  onChange,
  onPlaceSelect,
  active = true,
  readOnly = false,
  label,
  hint,
  error,
  address,
  title,
  onResolvedAddress,
  findingAddressLabel = "Finding address…",
  searchPlaceholder = "Search for a place…",
  searchingLabel = "Searching…",
  searchNoResultsLabel = "No places found.",
  className,
  mapClassName,
}: MapLocationPickerProps): ReactElement {
  const locale = useLocale();
  const location = value ?? DEFAULT_BRANCH_LOCATION;
  const interactive = !readOnly && typeof onChange === "function";

  const position = useMemo(
    (): [number, number] => [location.latitude, location.longitude],
    [location.latitude, location.longitude],
  );

  const typedAddress = address?.trim() ?? "";
  const tooltipTitle = title?.trim() ?? "";
  const [resolvedAddress, setResolvedAddress] =
    useState<LocalizedAddressResolution | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BranchPlaceSearchResult[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewZoom, setViewZoom] = useState<number | null>(null);
  const skipSearchRef = useRef(false);
  const onResolvedAddressRef = useRef(onResolvedAddress);
  onResolvedAddressRef.current = onResolvedAddress;

  useEffect(() => {
    if (typedAddress.length > 0) {
      setResolvedAddress(null);
      setResolvingAddress(false);
      return;
    }

    let cancelled = false;
    setResolvingAddress(true);

    const timer = window.setTimeout(() => {
      void reverseGeocodeLocalizedAddress(location)
        .then((result) => {
          if (cancelled) return;
          setResolvedAddress(result);
          onResolvedAddressRef.current?.(result);
        })
        .catch(() => {
          if (cancelled) return;
          const fallback = formatBranchCoordinates(location);
          const nextAddress = { en: fallback, ar: fallback };
          setResolvedAddress(nextAddress);
          onResolvedAddressRef.current?.(nextAddress);
        })
        .finally(() => {
          if (cancelled) return;
          setResolvingAddress(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.latitude, location.longitude, typedAddress]);

  useEffect(() => {
    if (!interactive) return;

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setSearchResults([]);
      setSearching(false);
      setSearchOpen(false);
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = window.setTimeout(() => {
      void searchBranchPlaces(trimmed, locale)
        .then((results) => {
          if (cancelled) return;
          setSearchResults(results);
          setSearchOpen(true);
        })
        .catch(() => {
          if (cancelled) return;
          setSearchResults([]);
        })
        .finally(() => {
          if (cancelled) return;
          setSearching(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [interactive, locale, searchQuery]);

  const localizedResolvedAddress =
    resolvedAddress === null
      ? ""
      : locale === "ar"
        ? resolvedAddress.ar
        : resolvedAddress.en;

  const tooltipAddress =
    typedAddress ||
    localizedResolvedAddress ||
    (resolvingAddress
      ? findingAddressLabel
      : formatBranchCoordinates(location));

  const handlePickLocation = (next: BranchMapLocation): void => {
    setViewZoom(null);
    onChange?.(next);
  };

  const handleSelectPlace = (place: BranchPlaceSearchResult): void => {
    skipSearchRef.current = true;
    setSearchQuery(place.label);
    setSearchResults([]);
    setSearchOpen(false);
    setSearching(false);
    setResolvedAddress(null);
    setViewZoom(16);
    onChange?.(place.location);
    onPlaceSelect?.(place);

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  };

  const showSearchPanel =
    interactive &&
    searchOpen &&
    searchQuery.trim().length >= 2 &&
    (searching || searchResults.length > 0 || !searching);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <p className="text-sm font-medium text-ink">{label}</p>
      ) : null}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}

      {interactive ? (
        <div className="relative z-20 mb-4">
          <MainInput
            type="search"
            size="sm"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setSearchOpen(true);
              }
            }}
            onBlur={() => {
              window.setTimeout(() => setSearchOpen(false), 120);
            }}
            placeholder={searchPlaceholder}
            startIcon={<Search />}
            autoComplete="off"
          />
          {showSearchPanel ? (
            <div className="absolute inset-x-0 top-[calc(100%+6px)] overflow-hidden rounded-xl border border-border bg-surface shadow-md">
              {searching ? (
                <p className="px-3 py-2.5 text-xs text-text-muted">
                  {searchingLabel}
                </p>
              ) : searchResults.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-text-muted">
                  {searchNoResultsLabel}
                </p>
              ) : (
                <ul className="max-h-48 overflow-y-auto py-1">
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-start text-xs text-ink transition-colors hover:bg-neutral-50"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectPlace(result);
                        }}
                      >
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "branch-map-theme relative z-0 rounded-2xl border border-border bg-neutral-100 shadow-xs",
          error && "border-danger-500",
          mapClassName,
        )}
      >
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={interactive}
          dragging={interactive}
          doubleClickZoom={interactive}
          zoomControl={interactive}
          className="branch-map-theme__canvas h-60 w-full sm:h-72"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <MapResizeFix active={active} />
          <MapCenterSync location={location} zoom={viewZoom} />
          {interactive ? <MapClickHandler onPick={handlePickLocation} /> : null}
          <Marker
            position={position}
            icon={brandMarkerIcon}
            draggable={interactive}
            eventHandlers={
              interactive
                ? {
                    dragend: (event: DragEndEvent) => {
                      const marker = event.target as L.Marker;
                      const next = marker.getLatLng();
                      handlePickLocation({
                        latitude: next.lat,
                        longitude: next.lng,
                      });
                    },
                  }
                : undefined
            }
          >
            <Tooltip
              key={`${locale}|${tooltipTitle}|${tooltipAddress}`}
              className="branch-map-tooltip"
              direction="top"
              offset={[0, -8]}
              opacity={1}
              permanent
              interactive={false}
            >
              <div
                className="branch-map-tooltip__body"
                dir={locale === "ar" ? "rtl" : "ltr"}
                lang={locale}
              >
                {tooltipTitle ? (
                  <span className="branch-map-tooltip__title">{tooltipTitle}</span>
                ) : null}
                <span className="branch-map-tooltip__address">{tooltipAddress}</span>
              </div>
            </Tooltip>
          </Marker>
        </MapContainer>
      </div>

      <p className="font-mono text-xs tabular-nums text-text-muted">
        {formatBranchCoordinates(location)}
      </p>
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}
