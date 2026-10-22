# Round 2 rules

## Your letter and your branch

Your kickoff message gives you a letter: **P**, **Q** or **R**.

- Start from `bakeoff/r2-base`, which is Quiet Waters (round 1's winner) plus this brief.
- Create and work only in `bakeoff/r2-<letter>`, in lower case: `bakeoff/r2-p`,
  `bakeoff/r2-q` or `bakeoff/r2-r`. Push often.
- Put your documents in `bakeoff/round2/entries/<LETTER>/`, in upper case. Starter files
  are in `bakeoff/round2/entries/_TEMPLATE/`.
- Outside that folder you may change anything in your own branch that the brief's scope
  allows.

**Never** push to `main`, `bakeoff/r2-base`, any `bakeoff/r1-*` branch or anyone else's
branch. Never merge or open a pull request. Never change Vercel, GitHub or CI settings,
environment variables or secrets.

## What you may read

- **Round 1 is open.** You may read and borrow from every `bakeoff/r1-*` branch and from
  `main`.
- **Round 2 is sealed.** Don't fetch, read or look for any other `bakeoff/r2-*` branch, or
  any other round 2 entry or preview, until the client says Gate 2 is open.

## No questions round

Round 1's answers in `bakeoff/QA.md` and the feedback in `bakeoff/round2/FEEDBACK.md` are
your brief. Where something is still unclear, make the call a world-class studio would
make, and record it in `DIGEST.md`. Don't stop to ask.

## Stay anonymous

Don't name your tool, company or model in any file, page or commit message you write.

## Personal data

The repository is public. Don't add personal information about the client's family. Demo
data uses invented names.

## Previews

Vercel builds every pushed branch, but previews sit behind the client's sign-in. Test
locally. Put the preview URL in `DONE.md` if you can find it; if not, give the branch name.

## Finishing

- Aim to finish in one working session.
- If you run short, ship what works and list the gaps honestly.
- The one unacceptable hand-in is a branch where `npm run build` fails or the board shows
  a blank page.

Finish in this order:
1. Write `DONE.md`.
2. Make a final commit with the message `bakeoff: round 2 entry <LETTER> ready`.
3. Push.
4. Stop.

## Later gates

- **Gate 2 (review):** you review the other entries, as in round 1.
- **Gate 3:** only if the client calls it.

The client will send separate instructions for each.
