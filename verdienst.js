/* =====================================================================
   Verdienst-Ticker fürs Mentoring-Cockpit (nur für Anne)
   Eigenständige Datei: index.html braucht nur <script src="verdienst.js"></script>.
   Lädt live aus dem Kalender über das Mentee-Bereich-Script (Aktion „verdienst“,
   nur mit Annes Team-Code). Bezahlung: #noc 50 €, #gcba/#gcpr 100 €,
   „Social Media Call“ geteilt mit Sam (50 €). Einstellungen stehen im Script.
   Aktualisiert sich alle 5 Minuten, beim Zurückkehren in den Tab und per Knopf.
   ===================================================================== */
(function () {
  const API = "https://script.google.com/macros/s/AKfycbyXyMPS_TaaBA6s7XjQR4d8v_R8O1ezR27FNddf-8Yv_HlY_t87kK1DSVLuCTezubIK/exec";
  const ALLE_MIN = 5;
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const del = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const euro = n => n.toLocaleString("de-DE", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
  const uhr = iso => { const d = new Date(iso); return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"); };

  // Code einmalig über ?z=CODE übergeben → im Browser merken, aus der Adresse entfernen
  const u = new URL(location.href);
  const z = (u.searchParams.get("z") || "").trim().toUpperCase();
  if (z) { set("mc-tet-code", z); u.searchParams.delete("z"); history.replaceState(null, "", u); }

  // Milchglas-Stil nachladen, falls die Seite ihn (nach einer Neuerzeugung) nicht mehr verlinkt
  if (!document.querySelector('link[href$="milchglas.css"]')) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "milchglas.css"; document.head.appendChild(l);
  }
  const css = document.createElement("style");
  css.textContent = `
.vd{background:var(--mg-dunkel,#18161F);border:1px solid var(--mg-dunkel-linie,rgba(255,255,255,.2));border-radius:28px;box-shadow:var(--mg-glas-schatten-stark,0 14px 32px rgba(0,0,0,.15));padding:24px;color:#ECEAF4;display:flex;flex-direction:column;gap:6px}
.vd h2{color:rgba(236,234,244,.72)}
.vd-kopf{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.vd-rechts{display:flex;align-items:center;gap:10px}
.vd-stand{font-size:.75rem;color:rgba(238,243,247,.6)}
.vd-neu{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:6px 14px;font:inherit;font-size:.8125rem;font-weight:600;cursor:pointer;min-height:36px}
.vd-neu:hover{background:rgba(255,255,255,.16)} .vd-neu:disabled{opacity:.6;cursor:wait}
.vd-zahl{font-size:clamp(2.25rem,3vw + 1.25rem,3.25rem);font-weight:800;letter-spacing:-.035em;line-height:1.05;color:#fff;font-variant-numeric:tabular-nums}
.vd-sub{color:rgba(238,243,247,.75)}
.vd-sub b,.vd-fuss b{color:#fff;font-weight:600}
.vd-spur{height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin:8px 0 4px}
.vd-spur i{display:block;height:100%;border-radius:inherit;background:var(--mg-akzent,#D7F25A)}
.vd-fuss{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:.8125rem;color:rgba(238,243,247,.7)}
.vd details{margin-top:8px;border-top:1px solid rgba(255,255,255,.12);padding-top:8px}
.vd summary{cursor:pointer;font-weight:600;font-size:.8125rem;color:#fff}
.vd ul{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}
.vd li{display:grid;grid-template-columns:3.2rem 1fr auto;gap:10px;font-size:.8125rem;padding:2px 0}
.vd li .tt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vd li.kommt{color:rgba(238,243,247,.6)}
.vd form{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.vd input{flex:1;min-width:200px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:8px;padding:9px 12px}`;
  document.head.appendChild(css);

  let box = null, offen = false, laedt = false;

  function einbauen() {
    if (box) return;
    box = document.createElement("section");
    box.className = "vd"; box.id = "verdienst"; box.setAttribute("aria-live", "polite");
    const kopf = document.querySelector(".wrap > header, .wrap .top");
    if (kopf) kopf.insertAdjacentElement("afterend", box);
    else (document.querySelector(".wrap") || document.body).prepend(box);
    box.addEventListener("click", e => { if (e.target.closest(".vd-neu")) laden(true); });
    box.addEventListener("toggle", e => { if (e.target.tagName === "DETAILS") offen = e.target.open; }, true);
    rahmen("Lädt …");
  }

  function rahmen(text, mitKnopf = true) {
    box.innerHTML = `<div class="vd-kopf"><h2>Dein Verdienst</h2>${mitKnopf ? `<div class="vd-rechts"><button class="vd-neu" type="button">↻ Aktualisieren</button></div>` : ""}</div><p class="vd-sub">${text}</p>`;
  }

  function codeFormular(text) {
    rahmen(text, false);
    box.insertAdjacentHTML("beforeend", `<form><input placeholder="Dein persönlicher Link aus dem Mentee-Bereich" autocomplete="off"><button class="vd-neu">Speichern</button></form>`);
    box.querySelector("form").addEventListener("submit", e => {
      e.preventDefault();
      const v = box.querySelector("input").value.trim(); const m = v.match(/z=([A-Z0-9]+)/i);
      set("mc-tet-code", (m ? m[1] : v).toUpperCase()); laden(true);
    });
  }

  function zeigen(v) {
    const erw = v.verdient + v.geplant;
    const ant = erw ? Math.round(v.verdient / erw * 100) : 0;
    const a = v.anzahl || {};
    const teile = [a.einzel ? a.einzel + "× 1:1" : "", a.gruppe ? a.gruppe + "× Gruppencall" : "", a.geteilt ? a.geteilt + "× Social Media Call (geteilt)" : ""].filter(Boolean).join(" · ");
    const liste = (v.termine || []).map(t => { const d = new Date(t.start);
      return `<li class="${t.vorbei ? "ist" : "kommt"}"><span>${d.getDate()}.${d.getMonth() + 1}.</span><span class="tt">${esc(t.titel)}</span><b>${euro(t.euro)}</b></li>`; }).join("");
    box.innerHTML = `<div class="vd-kopf"><h2>Dein Verdienst · ${esc(v.monat)}</h2>
      <div class="vd-rechts"><span class="vd-stand">Stand ${uhr(v.stand)} Uhr</span><button class="vd-neu" type="button">↻ Aktualisieren</button></div></div>
      <div class="vd-zahl">${euro(v.verdient)}</div>
      <div class="vd-sub">verdient bisher${v.geplant ? ` · <b>+ ${euro(v.geplant)}</b> schon gebucht → <b>${euro(erw)}</b> erwartet` : ""}</div>
      <div class="vd-spur"><i style="width:${ant}%"></i></div>
      <div class="vd-fuss"><span>${teile || "Noch keine bezahlten Termine in diesem Monat."}</span><span>${esc(v.vormonat)}: <b>${euro(v.vormonatSumme)}</b></span></div>
      ${liste ? `<details${offen ? " open" : ""}><summary>Alle Termine im ${esc(v.monat)}</summary><ul>${liste}</ul></details>` : ""}`;
  }

  async function laden(frisch) {
    if (!box || laedt) return;
    const code = get("mc-tet-code", "");
    if (!code) return codeFormular("Einmalig: Füge hier deinen persönlichen Mentee-Bereich-Link ein, dann siehst du deinen Verdienst live.");
    const alt = get("mc-verdienst", null);
    if (alt && !box.querySelector(".vd-zahl")) zeigen(alt);
    const knopf = box.querySelector(".vd-neu"); if (knopf) { knopf.disabled = true; knopf.textContent = "Lädt …"; }
    laedt = true;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ code, aktion: "verdienst", frisch: !!frisch }) });
      const d = await r.json();
      if (!d.ok) {
        if (/nur f|gültig/i.test(d.fehler || "")) { del("mc-tet-code"); return codeFormular("Der Code passt nicht. Bitte deinen eigenen Link aus dem Mentee-Bereich einfügen."); }
        throw new Error(d.fehler);
      }
      if (!d.verdienst) { if (!alt) rahmen("Fast fertig: Das Google-Script muss noch einmal aktualisiert werden (neue Version bereitstellen)."); return; }
      set("mc-verdienst", d.verdienst); zeigen(d.verdienst);
    } catch (e) {
      if (!alt) rahmen("Der Verdienst konnte gerade nicht geladen werden. Versuch es gleich noch einmal.");
    } finally {
      laedt = false;
      const k = box.querySelector(".vd-neu"); if (k && k.textContent === "Lädt …") { k.disabled = false; k.textContent = "↻ Aktualisieren"; }
    }
  }

  // Erst zeigen, wenn das Cockpit entsperrt ist
  function start() {
    if (document.body.classList.contains("locked")) return;
    einbauen(); laden(false);
  }
  new MutationObserver(start).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  start();
  setInterval(() => { if (box && document.visibilityState === "visible") laden(false); }, ALLE_MIN * 60000);
  document.addEventListener("visibilitychange", () => { if (box && document.visibilityState === "visible") laden(false); });
})();
