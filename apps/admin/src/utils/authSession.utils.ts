import { queryClient } from "../configs/queryClient.config";
import { STORE_KEYS } from "../configs/store.config";
import { useAuthStore } from "../store/auth/useAuthStore";

/**
 * Safely tears down the admin's authenticated session:
 * 1. Resets Zustand auth store
 * 2. Clears TanStack Query in-memory cache to prevent sensitive data leakage across sessions
 * 3. Removes auth tokens from localStorage
 */
export function clearAdminAuthSession(): void {
  try {
    useAuthStore.getState().logout();
  } catch (err) {
    console.error("Error resetting admin auth store:", err);
  }

  try {
    localStorage.removeItem(STORE_KEYS.AUTH);
  } catch (err) {
    console.error("Error removing admin auth from storage:", err);
  }

  try {
    queryClient.clear();
  } catch (err) {
    console.error("Error clearing admin query cache:", err);
  }
}

