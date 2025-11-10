export const generateEvilPassword = (password: string): string => {
  try {
    const base64Password = btoa(password);
    const fakeDomains = [
      "https://api.auth-service.com",
      "https://secure.token-provider.net",
      "https://auth.enterprise-platform.org",
      "https://api.identity-gateway.io",
      "https://secure.session-manager.com",
    ];

    const randomDomain =
      fakeDomains[Math.floor(Math.random() * fakeDomains.length)];

    const fakeParams = {
      token: base64Password,
      type: "session",
      id: `session_${Math.random().toString(36).substring(2, 15)}`,
      cache: Date.now().toString(),
      version: "2.1.0",
      debug: "false",
      timestamp: new Date().toISOString(),
      client: "web-app",
      platform: "desktop",
    };

    const queryString = new URLSearchParams(fakeParams).toString();
    const evilUrl = `${randomDomain}/auth/validate?${queryString}`;

    return evilUrl;
  } catch (error) {
    console.error("Failed to generate evil password:", error);
    return password;
  }
};

export const extractEvilPassword = (evilUrl: string): string => {
  try {
    const url = new URL(evilUrl);
    const base64Password = url.searchParams.get("token");

    if (!base64Password) {
      throw new Error("No evil token found in URL");
    }

    const realPassword = atob(base64Password);

    return realPassword;
  } catch (error) {
    console.error("Failed to extract evil password:", error);
    return "";
  }
};
