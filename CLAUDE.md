# Mentoring-Cockpit – Hinweise für Claude

Wenn du `index.html` neu erzeugst oder den „Cockpit-Stand“ aktualisierst, **müssen diese zwei Zeilen
direkt vor `</body></html>` erhalten bleiben**:

```html
<link rel="stylesheet" href="milchglas.css">
<script src="verdienst.js"></script>
```

- `milchglas.css`: TET-Design „Milchglas“ (seit 28.10.2026), überschreibt den eingebauten Stil.
  Schrift und Logo liegen in `milchglas/`. Nicht löschen.
- `verdienst.js`: Annes Verdienst-Ticker. Holt die bezahlten Termine live aus dem Kalender über
  das Mentee-Bereich-Script (Aktion `verdienst`, nur mit Annes Team-Code aus dem Browser-Speicher).
  Bezahlung: `#noc` 50 €, `#gcba`/`#gcpr` 100 €, „Social Media Call“ geteilt mit Sam (50 €).
  Co-Working macht Anne allein (voller Betrag). Die Regeln stehen im Script
  (`annesiebenkees-ai/tet-mentee-bereich`, `backend/Code.gs`, `VERGUETUNG` / `GETEILT_WORTE`).
- Der Verdienst gehört **nie** auf die Kundenseite (Mentee-Bereich), nur hierher.
