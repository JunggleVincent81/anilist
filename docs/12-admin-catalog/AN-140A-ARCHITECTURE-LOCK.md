# AN-140A — Admin Catalog Curation Architecture Lock

Status: **APPROVED AS BASELINE** — user continuation after blueprint review (2026-10-09).

- Retain `Anime` as the canonical UUID-identified record; retain external identity links and user relationships.
- Admin-only for the initial future interface. Existing MODERATOR role does not inherit catalog privileges.
- Private draft -> submitted -> review -> separately approved publication. No automatic age or artwork eligibility.
- Official classification and two-independent-person editorial review remain distinct, with separate production-country evidence.
- Original Indonesian synopsis editing is prioritized after protected read-only admin views; copyright review required for non-original text.
- Unapproved source URLs are not public assets; staging should use private storage when authorized later.
- Importer precedence, role assignment, provider/storage selection, publication rules and production deployment are later gates.

This lock authorizes an **additive schema preparation**. It does NOT authorize executing migration SQL against the development/production database, changing `isAdult`, backfilling assets, or writing canonical Anime fields.

Blueprint location at review time: `AN-140-ADMIN-CATALOG-CURATION-BLUEPRINT.md` (external review artifact). The blueprint's pending implementation gates remain binding.
