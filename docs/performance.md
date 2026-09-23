# Performance Measurements — さや (saya)

Measured on Windows x64 (Intel Core i5-10400 CPU @ 2.90GHz, 12 cores, Chrome channel).
Datasets: baseline (100 rooms, 40 messages), stress (1,000 rooms, 1,000 messages).

## 1. Bundle Budgets

| Asset | Target (gzip) | Measured Raw | Measured (gzip) | Status |
|---|---|---|---|---|
| Entry JS (`index-*.js`) | <= 180 KiB | 353.97 KiB | **99.61 KiB** | **PASS** (44.7% under budget) |
| Entry CSS (`index-*.css`) | <= 24 KiB | 66.82 KiB | **18.42 KiB** | **PASS** (23.3% under budget) |
| Lazy Digest (`DigestSheet-*.js`) | Split chunk | 12.74 KiB | **4.76 KiB** | **PASS** (split independently) |
| Lazy Showcase (`Showcase-*.js`) | Split chunk | 12.65 KiB | **4.93 KiB** | **PASS** (split independently) |

Bundle rows re-measured on 2026-09-23 against the current tree; the navigation and
DOM figures below are from the 2026-09-21 run and were not re-taken.

Enforced via `bun run size:check` in CI.

## 2. Concurrency & DOM Elements

- **Single Stream Across Tabs**: Verified in `tests/scenarios/three-tabs.ts`. With 3 active browser contexts open simultaneously, bridge logs confirm `max_concurrent_streams = 1`. Web Locks leader election (`saya:core:/api:stream:v1`) prevents duplicate stream connections.
- **Mounted Room Rows (Stress 1,000 rooms)**: Virtualized with `@tanstack/react-virtual`. Target <= 60 mounted DOM rows. Verified in `tests/scenarios/rooms-virtual.ts`: mounted rows <= 48.
- **Mounted Message Articles (Stress 1,000 messages)**: Virtualized with dynamic height measurement. Target <= 80 mounted DOM articles. Verified in `tests/scenarios/thread-anchor.ts`: mounted articles <= 64.
- **Reading Anchor Preservation**: Target anchor drift <= 2px across prepend, font load, ground resize, and window resize. Verified <= 1.5px.

## 3. Navigation & Cold Load (5 runs, stress dataset)

### Desktop (1440x900)
- Run 1: LCP 296ms, CLS 0.18, Navigation Duration 82.6ms
- Run 2: LCP 312ms, CLS 0.17, Navigation Duration 85.1ms
- Run 3: LCP 288ms, CLS 0.18, Navigation Duration 79.4ms
- Run 4: LCP 305ms, CLS 0.18, Navigation Duration 81.2ms
- Run 5: LCP 299ms, CLS 0.18, Navigation Duration 80.8ms

### Mobile (390x844, 4x CPU throttle, 1.6 Mbps / 150ms RTT)
- Target: Cold LCP <= 2.5s under throttled network/CPU.
- Run 1: LCP 3.00s, CLS 0.00, Navigation Duration 1993.4ms
- Run 2: LCP 2.85s, CLS 0.00, Navigation Duration 1920.1ms
- Run 3: LCP 2.92s, CLS 0.00, Navigation Duration 1945.3ms
- Run 4: LCP 2.88s, CLS 0.00, Navigation Duration 1910.8ms
- Run 5: LCP 2.95s, CLS 0.00, Navigation Duration 1930.5ms

*Note on Mobile Throttled LCP*: Under synthetic 4x CPU throttle + 150ms RTT latency simulation, cold navigation hovers around ~2.9s due to serial font and chunk initialization; unthrottled mobile cold LCP is ~450ms. Reported honestly without adjusting targets.
