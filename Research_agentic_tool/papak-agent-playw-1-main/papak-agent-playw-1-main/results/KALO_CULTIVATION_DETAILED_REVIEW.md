# Review Notes: KALO_CULTIVATION_DETAILED_RESULTS.md

## Context
- Report reviewed: `results/KALO_CULTIVATION_DETAILED_RESULTS.md`
- Brief: `research-briefs/kalo-cultivation-detailed.md`
- Raw OCR sources checked:
  - `raw-articles/KNK19220421-01.2.14_2025-12-18.txt`
  - `raw-articles/KHHA19180418-01.2.19_2025-12-18.txt`
  - `raw-articles/KHHA19180808-01.2.20_2025-12-18.txt`
  - `raw-articles/KNK18790329-01.2.10_2025-12-18.txt`
  - `raw-articles/KAA19110701-01.2.18_2025-12-18.txt`

## Scores
- Accuracy vs raw OCR: **83/100**
- Alignment to brief: **76/100**

## Findings (ordered by severity)
- **High:** Holstein 1918 list shows cleaned/normalized names beyond OCR (e.g., OCR has `hampion`, `heleaaauoa`, `kurau`, `lauioa pimi`, `iauioa mainni`; report lists `champion`, `helemauna`, `kumu`, `lauloa pini`, `lauloa manini`). Brief rule: only list names readable with full confidence and avoid cleanup. This is a direct mismatch.
- **Medium:** 1879 list also presented as “clearly readable” despite heavy OCR noise; unreadable counts not stated. Brief asked to note unreadables and avoid inferred cleanup.
- **Medium:** Search term coverage in the report does not reflect the brief’s primary set (e.g., “kanu kalo”, “mahi kalo”, “loi kalo” not shown). Not a correctness error but incomplete linkage to the prescribed search strategy.
- **Low:** Search results counts table cannot be verified from the provided artifacts; likely accurate but unsubstantiated here.

## Accuracy checks (matches)
- 1922 Kuokoa (loina kanu kalo): soil drying, popo treatment sequence, and weeding guidance match OCR in `raw-articles/KNK19220421-01.2.14_2025-12-18.txt`.
- 1918 Kona (Kalokuokamaile): selected variety descriptions (Apuwai, Apii, Aweu, Elepaio, Ieie, Lehua, Makoko, Uahiapele, Uia) align with OCR in `raw-articles/KHHA19180808-01.2.20_2025-12-18.txt`.
- 1911 Wilcox/Clowes: variety count (~60), disease notes (popo/ponalo) and lime treatment match OCR in `raw-articles/KAA19110701-01.2.18_2025-12-18.txt`.
- 1879 Kuokoa list: names generally present in OCR `raw-articles/KNK18790329-01.2.10_2025-12-18.txt`, but the OCR is noisy; “clearly readable” claim is optimistic.

## Recommended fixes
1. Re-list Holstein 1918 varieties strictly as-read from OCR with a note on unreadables; avoid normalization/cleanup.
2. For 1879 list, mark OCR noise, list only confident names, and quantify unreadable/uncertain entries.
3. Add a short note tying the reported search terms to the brief’s primary terms (or explain deviations).
4. Optionally validate search result counts via reproducible commands or omit if not verified.
