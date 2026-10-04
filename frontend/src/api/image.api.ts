import { API_ENDPOINTS } from "./api-endpoints";
import { getAuthToken } from "./auth-token";

// Mock function
async function getMockProcessedImage(): Promise<Blob> {
  const response = await fetch("/mocks/car1.webp");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  return response.blob();
}

// Real Image API function
export const imageApi = {
  processImage: async (formData: FormData): Promise<Blob> => {
    if (import.meta.env.VITE_USE_MOCK_API === "true") {
      return getMockProcessedImage();
    }

    const token = await getAuthToken();

    try {
      const response = await fetch(API_ENDPOINTS.images.process, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        // Om svaret är 401 (Unauthorized), försök dirigera användaren till inloggningssidan
        if (response.status === 401) {
          console.error("Authorization failed. Redirecting to login...");
          window.location.href = "/sign-in";
          throw new Error("Authentication required");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  },
};
