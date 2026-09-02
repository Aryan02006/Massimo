export const logout = async () => {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!(data.success && data.authenticated);
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};
