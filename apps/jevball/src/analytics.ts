// biome-ignore-all lint/style/useNamingConvention: PostHog's public configuration and event properties use snake case.
import posthog from "posthog-js";

// Same public project token as the main web app.
// biome-ignore lint/security/noSecrets: PostHog project tokens are public client identifiers.
const projectToken = "phc_ufKQAPQ2uWNyoQTGC3C3VkDs5TkuKQkaxVf4wPcFwky2";

const initAnalytics = () => {
  posthog.init(projectToken, {
    api_host: "https://us.i.posthog.com",
    autocapture: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_pageleave: false,
    capture_pageview: false,
    capture_performance: false,
    cookieless_mode: "always",
    defaults: "2026-05-30",
    disable_session_recording: true,
    disable_surveys: true,
    person_profiles: "never",
    ui_host: "https://us.posthog.com",
  });
  posthog.register({
    app: "jevball",
    environment: import.meta.env.MODE,
  });
  posthog.capture("$pageview");
};

const trackQuestion = (question: string) => {
  posthog.capture("jevball_question_asked", {
    question: question.trim(),
  });
};

export { initAnalytics, trackQuestion };
