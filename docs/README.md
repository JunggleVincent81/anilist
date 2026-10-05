# Anime Platform Documentation

Dokumentasi ini menjadi sumber kebenaran utama untuk keputusan produk, arsitektur, implementasi, dan laporan pengerjaan project.

## Aturan dokumentasi

1. Setiap phase memiliki tujuan dan acceptance criteria yang jelas.
2. Setelah satu phase selesai, buat laporan completion report di `docs/99-reports/`.
3. Perubahan keputusan yang sudah di-lock harus dicatat pada dokumen terkait dan pada laporan phase yang mengubahnya.
4. Git commit dan push dilakukan setelah phase atau milestone yang benar-benar selesai dan sudah diuji.
5. Dokumentasi tidak boleh menjadi birokrasi; hanya informasi yang berguna untuk memahami keadaan project yang perlu disimpan.

## Struktur

```text
docs/
├── README.md
├── ROADMAP.md
├── CHANGELOG.md
├── 00-product/
│   ├── PRODUCT-DEFINITION.md
│   ├── FEATURE-MAP.md
│   ├── PAGE-MAP.md
│   ├── USER-FLOWS.md
│   └── DECISIONS.md
└── 99-reports/
    ├── PHASE-00-COMPLETION-REPORT.md
    └── PHASE-REPORT-TEMPLATE.md
```

## Status saat ini

- Phase 0 — Product & UX Definition: **COMPLETE**
- Phase 1 — Project Foundation: **NEXT**
