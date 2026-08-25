const SITE_NAME = "Rory McMeekin";
const SITE_TITLE = "The personal website of Rory McMeekin. Links to my things and thoughts.";
const SITE_LANGUAGE = "en-GB";
const SITE_LOCALE = "en_GB";
const SITE_URL = new URL("https://rorz.io");
const WRITING_FEED_PATH = "/writing/feed.xml";
const SOCIAL_LINKS = [
  "https://github.com/rorz",
  "https://linkedin.com/in/rorz",
] as const;

const getAbsoluteUrl = (path: string | URL): string => new URL(path, SITE_URL).toString();

const RSS_ALTERNATES = {
  "application/rss+xml": WRITING_FEED_PATH,
} as const;

export {
  getAbsoluteUrl,
  RSS_ALTERNATES,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_LINKS,
  WRITING_FEED_PATH,
};
