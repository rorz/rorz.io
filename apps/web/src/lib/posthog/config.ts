const postHogConfig = {
  apiHost: "/x",
  // biome-ignore lint/security/noSecrets: PostHog project tokens are public client identifiers.
  projectToken: "phc_ufKQAPQ2uWNyoQTGC3C3VkDs5TkuKQkaxVf4wPcFwky2",
} as const;

export { postHogConfig };
