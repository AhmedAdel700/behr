export interface FetchFailureDetails {
  message: string;
  code?: string;
  url?: string;
}

export class AuthNetworkError extends Error {
  readonly code?: string;
  readonly url?: string;

  constructor(details: FetchFailureDetails) {
    super(details.message);
    this.name = "AuthNetworkError";
    this.code = details.code;
    this.url = details.url;
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const cause = error.cause;

  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    typeof cause.code === "string"
  ) {
    return cause.code;
  }

  return undefined;
}

export function getFetchFailureDetails(
  error: unknown,
  url?: string,
): FetchFailureDetails {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: readErrorCode(error),
      url,
    };
  }

  return {
    message: "Unknown fetch error",
    url,
  };
}

export function isFetchNetworkFailure(error: unknown): boolean {
  if (error instanceof AuthNetworkError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("fetch failed") ||
    error.name === "TypeError"
  );
}
