# Gotchas

Record issues, edge cases, and mitigations here.

- High event volume can starve UI rendering.
  - Mitigation: windowed rendering, virtualization, and throttled re-renders.
- Broker disconnects cause gaps.
  - Mitigation: exponential backoff reconnect, banner indicating degraded mode.
- Unknown or evolving message schemas.
  - Mitigation: tolerant DTOs; add contract tests; feature-flag new fields.
