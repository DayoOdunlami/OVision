> **Round 1, closed.** Kept as history. Round 2's brief is `bakeoff/round2/BRIEF.md`.

# Bake-off rules

Three studios, one brief (`bakeoff/BRIEF.md`), one starting point. These rules keep it
fair and keep the client's `main` safe.

## Your letter and your branch

Your kickoff message gives you a letter: **A**, **B** or **C**.

- Start from `bakeoff/r1-base`.
- Create and work only in `bakeoff/r1-<letter>` (lower case: `bakeoff/r1-a`,
  `bakeoff/r1-b` or `bakeoff/r1-c`). Push to it often.
- Put your documents in `bakeoff/entries/<LETTER>/` (upper case). Copy the starter
  files from `bakeoff/entries/_TEMPLATE/`.
- Outside that folder you may change anything in your own branch: restructure, delete,
  rewrite. It's your entry.

**Never** push to `main`, `bakeoff/r1-base` or anyone else's branch. Never merge, never
open a pull request into `main`, never change Vercel, GitHub or CI settings,
environment variables or secrets.

## Sealed until Gate 2

Until the client tells you Gate 2 is open:

- Don't fetch, check out, diff or read any other `bakeoff/r1-*` branch.
- Don't read any other entry's folder or open another entry's preview.
- Don't look for the other entries any other way.

## Stay anonymous

Entries are judged blind. Don't name your tool, company or model in any file, page or
commit message you write. If your tool adds an attribution line to commits by itself,
that's fine; just don't add one.

## Personal data

The repository is public. Don't add any new personal information about the client's
family. Demo data (`?demo=1`) uses invented names.

## Time and quality

- Aim to finish in one working session.
- If you run short, ship what works and list the gaps honestly in `DIGEST.md`.
- The one unacceptable hand-in is a branch whose `npm run build` fails or whose preview
  shows a blank page.

## Preview

Vercel builds every pushed branch. Put your preview URL in `DONE.md` if you can find it;
if not, write the branch name and the client will find it. Previews are behind the
client's Vercel sign-in, so you may not be able to open yours: test locally.

## The gates

| Gate | When | What you do |
|---|---|---|
| **0. Questions** | First | Create your branch, read `BRIEF.md` and these rules, and look around the repo and the live app. Write any questions in `bakeoff/entries/<LETTER>/QUESTIONS.md`, one numbered question per line, each saying why the answer would change what you build. Don't start designing or building. Push, then stop. **Every question and answer is published to all three studios**, anonymised, in `bakeoff/QA.md`. No questions is a fine answer; say so in the file. |
| **1. Build** | When the client says "Gate 1 is open" | Merge the latest `bakeoff/r1-base` into your branch, read `bakeoff/QA.md`, and treat its answers as part of the brief. From here on, don't ask; where something is unclear, make the call and record it in `DIGEST.md`. Do the brief. Finish with `DONE.md`, then a final commit with the message `bakeoff: entry <LETTER> ready`, then push. Then stop and wait. |
| **2. Review** | When the client says "Gate 2 is open" | Now you may fetch the other two entry branches. Previews are behind the client's Vercel sign-in, so check out each branch into its own folder (for example with `git worktree`), run `npm install` and `npm run dev`, and click through it with its demo link at phone and tablet size. Click through the product first, then read its `bakeoff/entries/` folder. Write `bakeoff/entries/<LETTER>/REVIEW.md` from `bakeoff/REVIEW-TEMPLATE.md`. Don't change your own product during this gate. Push, then stop. |
| **3. Reply** | When the client says "Gate 3 is open" | Read the reviews of your entry in the other two folders. Write **one** reply, `bakeoff/entries/<LETTER>/REPLY.md`: what you accept, what you dispute and why, and your final ranking (which may change). Push, then stop. This is the last word; there is no further round. |

After Gate 3 the client decides: a winner, or a winner plus named things borrowed from
the others. **Hybrids are only allowed in that form.** Round 2 has its own brief.
