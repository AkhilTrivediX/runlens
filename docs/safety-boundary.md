# Safety Boundary

RunLens is an observability tool for browser automation reliability.

It may detect, label, and surface possible challenge pages, captcha states, bot-blocking pages, session expiry, or manual-review states. It must not provide captcha solving, anti-bot evasion, fingerprint spoofing, stealth bypass logic, or behavior that modifies browser identity to avoid detection.

Adapters should remain passive by default. Debugger mode can collect richer traces, screenshots, DOM snapshots, and timeline details, but it should still avoid altering the behavior of the automation under observation.

