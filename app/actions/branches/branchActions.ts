"use server";

import { auth } from "@/auth";
import {
  createBranchRequest,
  deleteBranchRequest,
  fetchBranchById,
  fetchBranches,
  updateBranchRequest,
} from "@services/branches/branchesService";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type {
  BranchPayload,
  BranchesListQueryParams,
  BranchesPaginationMeta,
} from "@/types/BranchesApiTypes";
import { BranchesApiError } from "@/types/BranchesApiTypes";

async function getAuthContext(): Promise<{
  accessToken: string;
  tokenType: string;
  lang: string;
}> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new BranchesApiError("No active session.");
  }

  return {
    accessToken: session.accessToken,
    tokenType: session.tokenType || "Bearer",
    lang: "ar",
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BranchesApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch failed") || error.message === "Failed to fetch") {
      return "Could not reach the branches server.";
    }

    return error.message;
  }

  return fallback;
}

export async function getBranchesAction(
  lang = "ar",
  params?: BranchesListQueryParams,
): Promise<
  | {
      success: true;
      branches: AdminBranchRecord[];
      meta: BranchesPaginationMeta;
    }
  | { success: false; message: string }
> {
  try {
    const authContext = await getAuthContext();
    const result = await fetchBranches(
      authContext.accessToken,
      lang || authContext.lang,
      authContext.tokenType,
      params,
    );

    return {
      success: true,
      branches: result.branches,
      meta: result.meta,
    };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to load branches."),
    };
  }
}

export async function getBranchByIdAction(
  branchId: string,
  lang = "ar",
): Promise<
  | { success: true; branch: AdminBranchRecord }
  | { success: false; message: string }
> {
  try {
    const authContext = await getAuthContext();
    const branch = await fetchBranchById(
      authContext.accessToken,
      lang || authContext.lang,
      branchId,
      authContext.tokenType,
    );

    return { success: true, branch };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to load branch."),
    };
  }
}

export async function createBranchAction(
  body: BranchPayload,
  lang = "ar",
): Promise<
  | { success: true; branch: AdminBranchRecord; message: string }
  | { success: false; message: string }
> {
  try {
    const authContext = await getAuthContext();
    const result = await createBranchRequest(
      authContext.accessToken,
      lang || authContext.lang,
      body,
      authContext.tokenType,
    );

    return {
      success: true,
      branch: result.branch,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to create branch."),
    };
  }
}

export async function updateBranchAction(
  branchId: string,
  body: BranchPayload,
  lang = "ar",
): Promise<
  | { success: true; branch: AdminBranchRecord; message: string }
  | { success: false; message: string }
> {
  try {
    const authContext = await getAuthContext();
    const result = await updateBranchRequest(
      authContext.accessToken,
      lang || authContext.lang,
      branchId,
      body,
      authContext.tokenType,
    );

    return {
      success: true,
      branch: result.branch,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to update branch."),
    };
  }
}

export async function deleteBranchAction(
  branchId: string,
  lang = "ar",
): Promise<
  | { success: true; message: string }
  | { success: false; message: string }
> {
  try {
    const authContext = await getAuthContext();
    const result = await deleteBranchRequest(
      authContext.accessToken,
      lang || authContext.lang,
      branchId,
      authContext.tokenType,
    );

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to delete branch."),
    };
  }
}
