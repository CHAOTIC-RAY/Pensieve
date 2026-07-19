# mymind Feature Parity

Pensieve targets the same “remember everything, organize nothing” feel as [mymind](https://mymind.com/).

## Shipped in this pass

| mymind feature | Pensieve status |
|---|---|
| Color swatches (compact cards) | Compact strip + hex (smaller than notes) |
| Associative search + color filters | Omnibar + color filter rail + Colors type chip |
| Smart Spaces (saved searches) | **Spaces** rail — Save Space / apply / delete |
| Bidirectional linking | `[[Title]]` wiki links + link picker + backlinks in inspector |
| Serendipity | Existing Serendipity view |
| Top of Mind | Existing pin / Top of Mind strip |
| Distraction-free reader | Existing Reader Mode |
| AI tagging / summaries | Local LiteRT + cloud analyze |
| Quick notes | Omnibar `/note`, guest capture |
| Local-first privacy | IndexedDB vault, optional cloud sync |

## Not in this web app (by design / later)

- Native iOS / Android / browser **extension** capture (separate clients)
- OCR / advanced image object search
- Paid plan gates

## How to use new bits

1. **Compact colors** — paste `#CCC` or `/color` in the omnibar; cards stay short.
2. **Smart Spaces** — set filters/search → **Save Space** → click a chip to restore.
3. **Links** — in a note body write `[[Other Note Title]]`, or use **Linked Ideas** in the inspector.
