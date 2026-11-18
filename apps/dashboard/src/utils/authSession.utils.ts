import { queryClient } from "../configs/queryClient.config";
import { STORE_KEYS } from "../configs/store.config";
import { useAuthStore } from "../store/auth/useAuthStore";
import socketService from "../services/SocketService";

/**
 * Safely tears down the user's authenticated session:
 * 1. Resets Zustand auth store
 * 2. Clears TanStack Query in-memory cache to prevent sensitive data leakage across sessions
 * 3. Disconnects and leaves all active WebSocket rooms
 * 4. Removes auth tokens from localStorage
 */
export function clearAuthSession(): void {
  try {
    useAuthStore.getState().logout();
  } catch (err) {
    console.error("Error resetting auth store:", err);
  }

  try {
    localStorage.removeItem(STORE_KEYS.AUTH);
  } catch (err) {
    console.error("Error removing auth from storage:", err);
  }

  try {
    socketService.disconnect();
  } catch (err) {
    console.error("Error disconnecting socket service:", err);
  }

  try {
    queryClient.clear();
  } catch (err) {
    console.error("Error clearing TanStack query cache:", err);
  }
}

