import { auth } from "@/auth";

export async function getServerAccessToken(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
}
