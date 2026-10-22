# Final production offline, installation and loading receipt

Candidate served on localhost:4173; cache `tend-app-75475e5880783ac1`. This pass made no source or dist changes. All browser contexts and browsers were closed after testing.

## Offline: pass

A fresh persistent browser profile opened the demo online and waited for service-worker readiness and control. The cache contained **33 local resources**, including the lazy garden and verse-game JS/CSS, fonts, manifest, icons and entry HTML. The profile was then switched offline before opening previously unvisited deep queries.

| Offline query | Evidence |
|---|---|
| `/?view=play&mode=together&h=22` | 200; verse-game chunk opened offline, 12 physical word pieces fell, hint available |
| `/?view=prayer&mode=solo&step=1&h=6` | 200; exact weekly Scripture and prayer page rendered |
| `/?view=garden&h=22` | 200; lazy garden, journal and feed control rendered |
| `/?view=season&h=10` | 200; saved season rendered |

The stored household remained identical across these read-only visits. **Zero page errors, failed resources or external requests** were observed. This retests the earlier `Vary: Origin` module-cache failure after its worker fix.

## Installation eligibility: pass in local Chrome

Chrome's manifest parser returned no errors and resolved the root scope/id, standalone display, start URL and the four regular/maskable 192/512 PNG icons. A fresh persistent profile's installability check returned **an empty error list**. Actual native home-screen installation was not performed on an Android device.

## Loading: two-second target not proved

Two cold contexts used 1180 × 820, with the browser HTTP cache disabled. No test waited for network-idle or font readiness before checking the action. A MutationObserver marked when the actual “Pray quietly” button acquired a visible bounding box; FCP separately records browser painting. The action was then clicked and successfully opened the prayer in both profiles.

| Profile | Visible-button mark | First contentful paint | Automation selector receipt |
|---|---:|---:|---:|
| Cold local, no artificial throttle | 2.004 s | 2.648 s | 3.948 s |
| Cold local, CPU ×4, 10 Mbps, 80 ms latency | 8.560 s | 10.336 s | 11.954 s |

The latter timing misses the target in this proxy. The initial main bundle transferred approximately **63.2 KB including response overhead**; garden code was requested after the first contentful paint, and the physics chunk was not executed on the initial screen. No remote font or API dependency was present.

These are single samples from desktop Chromium in the execution environment, not measurements on an ordinary Android tablet. The environment has shown substantial timing variance, including slow localhost font requests in an earlier pass. That limitation does not justify claiming the two-second target is met. It needs a real-device performance pass and potentially further reduction of hydration/layout cost.

Raw receipt: [OFFLINE-RECEIPT.json](OFFLINE-RECEIPT.json). Diagnosis and fixes are documented in DIGEST.md. This timing receipt precedes the final secondary-label contrast/focus-only stylesheet clean-up. The final built book is checked separately by [FINAL-SMOKE.json](FINAL-SMOKE.json); those style changes are not a basis for claiming a faster load.
