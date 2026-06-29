const parseWhitelistDomains = () => {
  const envDomains = process.env.WHITELIST_DOMAINS || process.env.APP_CLIENT_URL;
  if (!envDomains) return ["http://localhost:5173"];

  return envDomains
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
};

export const WHITELIST_DOMAINS = parseWhitelistDomains();
export const BOARD_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
};
