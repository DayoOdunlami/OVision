# Round 2 kickoff (for the client)

1. Decide privately which tool gets which letter (P, Q, R). Keep the mapping out of the
   repo.
2. Start each agent in a **new session** on this repository, with the base branch set to
   `bakeoff/r2-base`.
3. Paste the matching message.

## Gate 1: build (one message per tool)

### P

```
You are studio P in round 2 of a design and build bake-off on this repository.
Check out bakeoff/r2-base, then create and work only in a new branch called bakeoff/r2-p.
Read bakeoff/round2/BRIEF.md, bakeoff/round2/FEEDBACK.md and bakeoff/round2/RULES.md in full before doing anything else, then follow them.
Your letter is P, so your documents go in bakeoff/round2/entries/P/.
Commit your style tiles before any product code. Push as you go, and finish with DONE.md and a final commit with the message "bakeoff: round 2 entry P ready".
Don't stop to ask me questions. Where something is unclear, make the call a world-class studio would make, note it in DIGEST.md and carry on.
```

### Q

```
You are studio Q in round 2 of a design and build bake-off on this repository.
Check out bakeoff/r2-base, then create and work only in a new branch called bakeoff/r2-q.
Read bakeoff/round2/BRIEF.md, bakeoff/round2/FEEDBACK.md and bakeoff/round2/RULES.md in full before doing anything else, then follow them.
Your letter is Q, so your documents go in bakeoff/round2/entries/Q/.
Commit your style tiles before any product code. Push as you go, and finish with DONE.md and a final commit with the message "bakeoff: round 2 entry Q ready".
Don't stop to ask me questions. Where something is unclear, make the call a world-class studio would make, note it in DIGEST.md and carry on.
```

### R (optional third entry)

```
You are studio R in round 2 of a design and build bake-off on this repository.
Check out bakeoff/r2-base, then create and work only in a new branch called bakeoff/r2-r.
Read bakeoff/round2/BRIEF.md, bakeoff/round2/FEEDBACK.md and bakeoff/round2/RULES.md in full before doing anything else, then follow them.
Your letter is R, so your documents go in bakeoff/round2/entries/R/.
Commit your style tiles before any product code. Push as you go, and finish with DONE.md and a final commit with the message "bakeoff: round 2 entry R ready".
Don't stop to ask me questions. Where something is unclear, make the call a world-class studio would make, note it in DIGEST.md and carry on.
```

If an agent stops early:

```
Carry on through bakeoff/round2/BRIEF.md without stopping until DONE.md is pushed.
```

## When they're done

Tell Claude in the chat. It reads every entry, finds the preview links and updates the hub.
Then it gives you the Gate 2 review message.
