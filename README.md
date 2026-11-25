# AI Dating Intelligence — website

Landing page for **AI Dating Intelligence**, an open-source initiative by Healthy Relationship Indicators.
It presents the vision and collects anonymous dating conversations for the research dataset.

Static site (`index.html`, `style.css`, `script.js`) served with GitHub Pages from the `main` branch.

## Data collection

Submissions are sent to [Formspree](https://formspree.io). Set the form ID in `script.js`:

```js
const FORMSPREE_ID = "abcdwxyz";
```

Until it is set, the form shows "Submissions open soon".

## Local preview

```sh
python3 -m http.server 8000
```
