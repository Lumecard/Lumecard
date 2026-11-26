# Card templates (PNG)

Cards that are a picture instead of a gradient. Each has a front and a back, and the card
has a button to flip between them.

## Where things live

| Path | What |
|---|---|
| `public/cards/<id>/front.webp` and `back.webp` | The finished card, served to users |
| `public/cards/<id>/thumb.webp` | A small version (320 x 178) for the design picker |
| `src/cards/templates.ts` | The list of templates (one line each) |

The files are WebP, not PNG: the same look at about a tenth of the size, so cards load fast.
The original PNGs are in git history (commit `d7e5b6b`).

## Adding a design

1. Make two pictures, **2160 x 1200 px** (ratio 1.8 : 1, the same as the cards on the site; the
   site shows them at half that size, so they stay sharp on high-density screens). Full bleed
   and square corners: the site rounds them.
2. Convert them to WebP (quality about 90) and make a 320 x 178 `thumb.webp` from the front.
   Put all three in `public/cards/<id>/`. Use a short lowercase id.
3. Add `png("<id>", "Label", "anime")` (or `"professional"`) to `src/cards/templates.ts`.

It then appears in the design picker and on the claim page. The id is saved inside each gift
link, so do not rename it after gifts have been sent.

## Keep the bottom of the front clear

The front shows a "Gift Card Value" bar over the bottom quarter. Leave that area free of faces
and text. The back has no overlay.

## Character artwork

Anime and other character art belongs to its owners. Only use pictures you are licensed to
use in a product. The 3 professional designs here are original and made for Lumecard.
