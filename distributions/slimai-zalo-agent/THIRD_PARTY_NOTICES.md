# Third-party notices

SlimAI maintains the skill, onboarding, packaging and modified runtime in this distribution.

The CLI runtime derives from https://github.com/PhucMPham/zalo-agent-cli at commit c8effbf98514a154f7ca77d6e65f9e9a072e90e4, version 1.7.0, under the MIT License. This provenance is not a claim of upstream authorship by SlimAI. The original license is preserved verbatim at assets/cli/LICENSE.

Modifications include isolated credential storage, SlimAI CLI and QR branding, loopback-only QR serving, removal of automatic update checks from the entry point, the separate-caption send helper, batch journaling and reply monitoring.

The runtime uses third-party npm dependencies including zca-js. Their licenses and copyright notices remain in installed node_modules. Dependency versions and integrity hashes are recorded in assets/cli/package-lock.json.
