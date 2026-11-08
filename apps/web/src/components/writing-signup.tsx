import { GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { WRITING_FEED_PATH } from "@/lib/seo/site.ts";

const WritingSignup = () => (
  <form
    action="https://buttondown.com/api/emails/embed-subscribe/rorz"
    aria-label="Subscribe to Rory’s writing"
    className="mt-12 flex w-full flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-700"
    method="post"
  >
    <h3 className="font-sans text-xl font-semibold">Subscribe to future writing</h3>
    <p className="font-serif text-lg leading-snug">I’ll email you when I write something new.</p>
    <input name="embed" type="hidden" value="1" />
    <div className="flex w-full max-w-md items-center gap-4">
      <div className="flex min-w-0 flex-1">
        <input
          aria-label="Email address"
          autoComplete="email"
          className="min-h-11 min-w-0 flex-1 rounded-none border border-zinc-400 bg-surface px-3 text-base placeholder:text-accent focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:border-zinc-500"
          name="email"
          placeholder="Your email address"
          required={true}
          type="email"
        />
        <button
          className="cursor-pointer bg-ink px-4 text-sm font-semibold text-surface hover:bg-accent focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          type="submit"
        >
          Subscribe
        </button>
      </div>
      <a
        aria-label="Writing RSS feed"
        className="text-sm text-accent underline underline-offset-2 hover:text-ink"
        href={WRITING_FEED_PATH}
      >
        Or use RSS
      </a>
    </div>
    <div className="font-serif text-lg mt-2">
      <p className="font-serif">You can also follow me on:</p>
      <ul>
        <li>
          <a
            className="inline-flex items-center gap-1.5"
            href="https://x.com/rorzio"
            rel="noopener"
            target="_blank"
          >
            <XLogoIcon weight="duotone" />{" "}
            <span className="underline underline-offset-2">X.com (@rorzio)</span>
          </a>
        </li>
        <li>
          <a
            className="inline-flex items-center gap-1.5"
            href="https://linkedin.com/in/rorz"
            rel="noopener"
            target="_blank"
          >
            <LinkedinLogoIcon weight="regular" />{" "}
            <span className="underline underline-offset-2">LinkedIn (@rorz)</span>
          </a>
        </li>
        <li>
          <a
            className="inline-flex items-center gap-1.5"
            href="https://github.com/rorz"
            rel="noopener"
            target="_blank"
          >
            <GithubLogoIcon weight="regular" />{" "}
            <span className="underline underline-offset-2">GitHub (@rorz)</span>
          </a>
        </li>
      </ul>
    </div>
  </form>
);

export { WritingSignup };
