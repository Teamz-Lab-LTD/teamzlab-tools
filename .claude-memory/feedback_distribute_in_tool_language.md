---
name: Distribution articles must match tool language
description: MANDATORY — When distributing non-English tools, write articles in the SAME language as the tool (French tools → French article, Polish tools → Polish article)
type: feedback
---

Distribution articles MUST be written in the SAME language as the tools they describe.

**Why:** User explicitly called this out — "why distribution is not actually the content language? suppose as it is a france tool and written in frence so the distribution will also in frence." Previous articles about Finnish, German, and Japanese tools were written in English, which defeats the purpose of localized content.

**How to apply:**
- When writing a distribution article for `/de/` tools → write in German
- When writing a distribution article for `/fr/` tools → write in French
- When writing a distribution article for `/pl/` tools → write in Polish
- When writing a distribution article for `/cz/` tools → write in Czech
- When writing a distribution article for `/be/` tools → write in Dutch
- When writing a distribution article for `/lu/` tools → write in German
- When writing a distribution article for `/es/` tools → write in Spanish
- When writing a distribution article for `/pt/` tools → write in Portuguese
- When writing about tools from MULTIPLE language hubs → write in English but include native-language sections
- ALWAYS set `language: XX` in article frontmatter (e.g., `language: pl`)
- The distribute.py script now uses this to localize the footer text

**distribute.py changes made:**
- Added `LOCALIZED_FOOTERS` dict with 17 languages
- `read_markdown()` now reads `language` frontmatter field
- Footer text is localized based on article language
- Country table updated with BE, LU, PL, CZ + all other country hubs
