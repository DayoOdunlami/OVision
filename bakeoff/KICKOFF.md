# Kickoff (for the client)

## Before you start

1. Decide privately which tool gets which letter, and **don't write the mapping in the
   repo**. Example: Cursor = A, Codex = B, Claude Code = C.
2. Start each agent on this repository with the base branch set to `bakeoff/r1-base`.
3. Paste the matching Gate 0 message below. Keep each agent's session open between
   gates, so it keeps its context.

## Gate 0: questions (paste one per tool)

### A

```
You are studio A in a three-way design and build bake-off on this repository.
Check out bakeoff/r1-base, then create and work only in a new branch called bakeoff/r1-a.
Read bakeoff/BRIEF.md and bakeoff/RULES.md in full. We are at Gate 0.
Look around the repo, its docs and the live app (https://o-vision.vercel.app), then write any questions you have in bakeoff/entries/A/QUESTIONS.md, as the Gate 0 row in RULES.md describes.
Ask only what would genuinely change what you build. Every question and answer will be shared with all three studios.
Push to bakeoff/r1-a and stop. Don't start designing or building yet.
```

### B

```
You are studio B in a three-way design and build bake-off on this repository.
Check out bakeoff/r1-base, then create and work only in a new branch called bakeoff/r1-b.
Read bakeoff/BRIEF.md and bakeoff/RULES.md in full. We are at Gate 0.
Look around the repo, its docs and the live app (https://o-vision.vercel.app), then write any questions you have in bakeoff/entries/B/QUESTIONS.md, as the Gate 0 row in RULES.md describes.
Ask only what would genuinely change what you build. Every question and answer will be shared with all three studios.
Push to bakeoff/r1-b and stop. Don't start designing or building yet.
```

### C

```
You are studio C in a three-way design and build bake-off on this repository.
Check out bakeoff/r1-base, then create and work only in a new branch called bakeoff/r1-c.
Read bakeoff/BRIEF.md and bakeoff/RULES.md in full. We are at Gate 0.
Look around the repo, its docs and the live app (https://o-vision.vercel.app), then write any questions you have in bakeoff/entries/C/QUESTIONS.md, as the Gate 0 row in RULES.md describes.
Ask only what would genuinely change what you build. Every question and answer will be shared with all three studios.
Push to bakeoff/r1-c and stop. Don't start designing or building yet.
```

**Then come back to the chat with Claude.** It reads all three QUESTIONS.md files, merges
them, drafts answers for you to approve and publishes `bakeoff/QA.md` on the base branch.

## Gate 1: build (the same message to all three)

```
Gate 1 is open. Merge the latest origin/bakeoff/r1-base into your branch and read bakeoff/QA.md: its answers are now part of the brief.
Follow the Gate 1 row in bakeoff/RULES.md and work through every phase in bakeoff/BRIEF.md.
Push as you go, and finish with DONE.md and a final commit with the message "bakeoff: entry <your letter> ready".
Don't stop to ask me questions. Where something is unclear, make the call a world-class studio would make, note it in DIGEST.md and carry on.
```

If an agent stops early or asks to carry on:

```
Carry on through the remaining phases in bakeoff/BRIEF.md without stopping until DONE.md is pushed.
```

## Gate 2: review (once all three are done)

```
Gate 2 is open. Follow the Gate 2 row in bakeoff/RULES.md.
Fetch the other two entry branches (from bakeoff/r1-a, bakeoff/r1-b and bakeoff/r1-c, all except your own).
Previews are behind my Vercel sign-in, so check out each branch into its own folder, run it locally (npm install, npm run dev), use its demo link, and click through at phone and tablet size before reading its documents.
Then write your REVIEW.md from bakeoff/REVIEW-TEMPLATE.md, push it to your own branch, and stop.
Don't change your product.
```

## Gate 3: reply (once all three reviews are in)

```
Gate 3 is open. Follow the Gate 3 row in bakeoff/RULES.md.
Fetch the other two entry branches again and read what they wrote about you in their REVIEW.md.
Write one REPLY.md, push it to your own branch, and stop.
This is the last round.
```

## Coming back to Claude

After each gate, tell Claude in the chat where you planned this. It can see every branch:

- **After Gate 0:** it drafts the shared answers.
- **After Gate 1:** it gives you a side-by-side summary and a hub page for clicking
  between the three previews.
- **After Gates 2 and 3:** it summarises where the reviews agree and disagree.
