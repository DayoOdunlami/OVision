# Style study rules

## Your letter and your branch

Your kickoff message gives you a letter: **S** or **T**.

- Start from `bakeoff/study-base`, which is Quiet Waters plus this brief.
- Create and work only in `bakeoff/study-<letter>`, in lower case: `bakeoff/study-s` or
  `bakeoff/study-t`. Push often.
- Put your documents in `bakeoff/study/entries/<LETTER>/`, in upper case. Starter files are
  in `bakeoff/study/entries/_TEMPLATE/`.

What you may change:
- Add `study/index.html` and any new source files.
- Add the `/study/` entry to `vite.config.js`.
- Add packages if you need them.
- Don't change how any existing page looks or behaves.

**Never** push to `main`, `bakeoff/study-base`, or any other `bakeoff/` branch. Never merge
or open a pull request. Never change Vercel, GitHub or CI settings, environment variables
or secrets.

## What you may read

- **Open:** `main`, and every `bakeoff/r1-*` and `bakeoff/r2-*` branch. Reuse code from
  them with credit, for example the vine writer in `src/flourish/lib/` on `main`.
- **Sealed:** don't fetch, read or look for the other `bakeoff/study-*` branch until the
  client opens Gate 2.

## No questions

The brief is the brief. Where something is unclear, make the call a world-class studio
would make, record it in `STUDY.md`, and carry on.

## Anonymous and private

- Don't name your tool, company or model in any file, page or commit message you write.
- The repository is public. Add no personal information.

## Previews

Vercel builds each pushed branch, but previews sit behind the client's sign-in. Test
locally. Put the preview URL in `DONE.md` if you can find it.

## Finishing

Aim for one working session. If you run short, ship what works and say what's missing.
The unacceptable hand-in is a failing build or a blank page.

Finish in this order:
1. Write `DONE.md`.
2. Make a final commit with the message `bakeoff: study <LETTER> ready`.
3. Push.
4. Stop.
