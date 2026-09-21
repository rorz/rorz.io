const answerGroups = [
  "yes",
  "uncertain",
  "no",
] as const;

// This order is the stable face index for the future Three.js icosahedron.
const answers = [
  {
    group: "yes",
    id: "it-is-certain",
    text: "It is certain",
  },
  {
    group: "yes",
    id: "it-is-decidedly-so",
    text: "It is decidedly so",
  },
  {
    group: "yes",
    id: "without-a-doubt",
    text: "Without a doubt",
  },
  {
    group: "yes",
    id: "yes-definitely",
    text: "Yes definitely",
  },
  {
    group: "yes",
    id: "you-may-rely-on-it",
    text: "You may rely on it",
  },
  {
    group: "yes",
    id: "as-i-see-it-yes",
    text: "As I see it, yes",
  },
  {
    group: "yes",
    id: "most-likely",
    text: "Most likely",
  },
  {
    group: "yes",
    id: "outlook-good",
    text: "Outlook good",
  },
  {
    group: "yes",
    id: "yes",
    text: "Yes",
  },
  {
    group: "yes",
    id: "signs-point-to-yes",
    text: "Signs point to yes",
  },
  {
    group: "uncertain",
    id: "reply-hazy-try-again",
    text: "Reply hazy, try again",
  },
  {
    group: "uncertain",
    id: "ask-again-later",
    text: "Ask again later",
  },
  {
    group: "uncertain",
    id: "better-not-tell-you-now",
    text: "Better not tell you now",
  },
  {
    group: "uncertain",
    id: "cannot-predict-now",
    text: "Cannot predict now",
  },
  {
    group: "uncertain",
    id: "concentrate-and-ask-again",
    text: "Concentrate and ask again",
  },
  {
    group: "no",
    id: "dont-count-on-it",
    text: "Don't count on it",
  },
  {
    group: "no",
    id: "my-reply-is-no",
    text: "My reply is no",
  },
  {
    group: "no",
    id: "my-sources-say-no",
    text: "My sources say no",
  },
  {
    group: "no",
    id: "outlook-not-so-good",
    text: "Outlook not so good",
  },
  {
    group: "no",
    id: "very-doubtful",
    text: "Very doubtful",
  },
] as const;

type AnswerId = (typeof answers)[number]["id"];
const answerCatalog = answers.map((answer, faceIndex) => ({
  ...answer,
  faceIndex,
}));

export type { AnswerId };
export { answerCatalog, answerGroups };
