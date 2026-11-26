# Card templates (PNG)

Cards that are a picture instead of a gradient. Each has a front and a back, and the card
has a button to flip between them.

## Where things live

| Path | What |
|---|---|
| `public/cards/<id>/front.png` and `back.png` | The finished card, served to users |
| `src/cards/templates.ts` | The list of templates (one line each) |

## Adding a design

1. Make two pictures, **2160 x 1200 px** (ratio 1.8 : 1, the same as the cards on the site; the
   site shows them at half that size, so they stay sharp on high-density screens). Full bleed
   and square corners: the site rounds them.
2. Put them in `public/cards/<id>/` as `front.png` and `back.png`. Use a short lowercase id.
3. Add `png("<id>", "Label", "anime")` (or `"professional"`) to `src/cards/templates.ts`.

It then appears in the design picker and on the claim page. The id is saved inside each gift
link, so do not rename it after gifts have been sent.

## Keep the bottom of the front clear

The front shows a "Gift Card Value" bar over the bottom quarter. Leave that area free of faces
and text. The back has no overlay.

## Character artwork

Anime and other character art belongs to its owners. Only use pictures you are licensed to
use in a product. The 3 professional designs here are original and made for Lumecard.
