"use client";

import posthog from "posthog-js";
import { type FC, useEffect } from "react";

interface PostHogProps {
  readonly apiHost: string;
  readonly projectToken: string;
}

const PostHog: FC<PostHogProps> = ({ apiHost, projectToken }) => {
  useEffect(() => {
    posthog.init(projectToken, {
      // biome-ignore lint/style/useNamingConvention: PostHog's public configuration keys use snake case.
      api_host: apiHost,
      // biome-ignore lint/style/useNamingConvention: PostHog's public configuration keys use snake case.
      cookieless_mode: "always",
      defaults: "2026-05-30",
      // biome-ignore lint/style/useNamingConvention: PostHog's public configuration keys use snake case.
      ui_host: "https://us.posthog.com",
    });
  }, [
    apiHost,
    projectToken,
  ]);

  return null;
};

export { PostHog };
