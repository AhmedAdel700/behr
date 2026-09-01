export interface BranchMapLocation {
  latitude: number;
  longitude: number;
}

export interface LocalizedAddressResolution {
  en: string;
  ar: string;
}

/** Default map center (Riyadh). */
export const DEFAULT_BRANCH_LOCATION: BranchMapLocation = {
  latitude: 24.7136,
  longitude: 46.6753,
};

export const BRANCH_CITY_LOCATIONS: Record<string, BranchMapLocation> = {
  riyadh: { latitude: 24.7136, longitude: 46.6753 },
  jeddah: { latitude: 21.4858, longitude: 39.1925 },
  dammam: { latitude: 26.4207, longitude: 50.0888 },
  khobar: { latitude: 26.2172, longitude: 50.1971 },
};

interface NominatimAddressParts {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  district?: string;
  borough?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  province?: string;
  region?: string;
  postcode?: string;
  building?: string;
  amenity?: string;
  shop?: string;
  office?: string;
  tourism?: string;
  leisure?: string;
}

interface NominatimReverseResponse {
  address?: NominatimAddressParts;
  name?: string;
}

interface BigDataCloudResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
  localityInfo?: {
    administrative?: Array<{ name?: string; adminLevel?: number }>;
    informative?: Array<{ name?: string; description?: string }>;
  };
}

/**
 * Resolve a detailed local address for a map pin (no country / continent).
 */
export async function reverseGeocodeAddress(
  location: BranchMapLocation,
  language: string = "en",
): Promise<string | null> {
  const localityLanguage = language.toLowerCase().startsWith("ar") ? "ar" : "en";
  const separator = localityLanguage === "ar" ? "، " : ", ";

  const fromNominatim = await reverseGeocodeNominatim(
    location,
    localityLanguage,
    separator,
  ).catch(() => null);
  if (fromNominatim) {
    return fromNominatim;
  }

  return reverseGeocodeBigDataCloud(
    location,
    localityLanguage,
    separator,
  ).catch(() => null);
}

export async function reverseGeocodeLocalizedAddress(
  location: BranchMapLocation,
): Promise<LocalizedAddressResolution> {
  const fallback = formatBranchCoordinates(location);
  const [en, ar] = await Promise.all([
    reverseGeocodeAddress(location, "en"),
    reverseGeocodeAddress(location, "ar"),
  ]);

  return {
    en: en ?? fallback,
    ar: ar ?? fallback,
  };
}

async function reverseGeocodeNominatim(
  location: BranchMapLocation,
  language: string,
  separator: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(location.latitude),
    lon: String(location.longitude),
    addressdetails: "1",
    namedetails: "1",
    zoom: "18",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": language,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json();
  if (!isNominatimReverseResponse(data) || !data.address) {
    return null;
  }

  return formatLocalAddressParts(
    buildNominatimAddressParts(data.address, data.name),
    separator,
  );
}

function buildNominatimAddressParts(
  address: NominatimAddressParts,
  placeName?: string,
): Array<string | undefined> {
  const streetName =
    address.road ??
    address.pedestrian ??
    address.footway ??
    address.residential;
  const street = [address.house_number, streetName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");

  const place =
    placeName?.trim() ||
    address.amenity ||
    address.building ||
    address.shop ||
    address.office ||
    address.tourism ||
    address.leisure;

  return [
    place && place !== street ? place : undefined,
    street || undefined,
    address.neighbourhood,
    address.suburb,
    address.quarter,
    address.city_district ?? address.district ?? address.borough,
    address.city ??
      address.town ??
      address.village ??
      address.hamlet ??
      address.municipality,
    address.county,
    address.postcode,
    address.state ?? address.province ?? address.region,
  ];
}

async function reverseGeocodeBigDataCloud(
  location: BranchMapLocation,
  language: string,
  separator: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    localityLanguage: language,
  });

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
  );

  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json();
  if (!isBigDataCloudResponse(data)) {
    return null;
  }

  const adminParts =
    data.localityInfo?.administrative
      ?.filter(
        (entry) =>
          typeof entry.adminLevel === "number" &&
          entry.adminLevel >= 4 &&
          entry.adminLevel <= 10,
      )
      .sort(
        (left, right) => (right.adminLevel ?? 0) - (left.adminLevel ?? 0),
      )
      .map((entry) => entry.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const landmark = data.localityInfo?.informative
    ?.filter((entry) => {
      const description = entry.description?.toLowerCase() ?? "";
      return (
        description.includes("neighbourhood") ||
        description.includes("neighborhood") ||
        description.includes("suburb") ||
        description.includes("district") ||
        description.includes("building") ||
        description.includes("road") ||
        description.includes("street")
      );
    })
    .map((entry) => entry.name?.trim())
    .find((name): name is string => Boolean(name));

  return formatLocalAddressParts(
    [
      landmark,
      ...adminParts.slice(0, 3),
      data.locality,
      data.city,
      data.postcode,
      data.principalSubdivision,
    ],
    separator,
  );
}

function formatLocalAddressParts(
  parts: Array<string | undefined>,
  separator: string,
): string | null {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique.length > 0 ? unique.join(separator) : null;
}

function isNominatimReverseResponse(
  value: unknown,
): value is NominatimReverseResponse {
  return typeof value === "object" && value !== null;
}

function isBigDataCloudResponse(value: unknown): value is BigDataCloudResponse {
  return typeof value === "object" && value !== null;
}

export function formatBranchCoordinates(location: BranchMapLocation): string {
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

export interface BranchPlaceSearchResult {
  id: string;
  label: string;
  location: BranchMapLocation;
}

interface NominatimSearchItem {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
}

/**
 * Search places by free-text query and return mappable coordinates.
 */
export async function searchBranchPlaces(
  query: string,
  language: string = "en",
): Promise<BranchPlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const localityLanguage = language.toLowerCase().startsWith("ar") ? "ar" : "en";
  const params = new URLSearchParams({
    format: "jsonv2",
    q: trimmed,
    addressdetails: "0",
    limit: "6",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": localityLanguage,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  const results: BranchPlaceSearchResult[] = [];

  for (const item of data) {
    if (!isNominatimSearchItem(item)) continue;
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    const label = item.display_name?.trim();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !label) {
      continue;
    }

    results.push({
      id: String(item.place_id ?? `${latitude},${longitude},${label}`),
      label,
      location: { latitude, longitude },
    });
  }

  return results;
}

function isNominatimSearchItem(value: unknown): value is NominatimSearchItem {
  return typeof value === "object" && value !== null;
}

