import { getCookie } from "cookies-next";
import { normalizeLangHeader } from "@services/auth/shared";

export async function getRequestLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return normalizeLangHeader(
    typeof localeCookie === "string" ? localeCookie : undefined,
  );
}
