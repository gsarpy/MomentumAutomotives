(function () {
  const S = window.SITE || {};
  const INV = window.INVENTORY || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = n => "$" + Math.round(n).toLocaleString("en-US");

  // Business details
  $$("[data-phone]").forEach(el => (el.textContent = S.phone));
  $$("[data-phone-link]").forEach(el => (el.href = "tel:" + S.phoneE164));
  $$("[data-email]").forEach(el => (el.textContent = S.email));
  $$("[data-email-link]").forEach(el => (el.href = "mailto:" + S.email));
  $$("[data-address]").forEach(el => (el.textContent = S.address));
  const map = $(".map-wrap iframe");
  if (map && S.mapQuery) map.src = "https://www.google.com/maps?q=" + encodeURIComponent(S.mapQuery) + "&output=embed";
  $("#year").textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = $("#navToggle"), links = $("#navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", e => { if (e.target.tagName === "A") links.classList.remove("open"); });

  // Inventory
  const placeholder = `<div class="car-ph"><svg viewBox="0 0 120 50" aria-hidden="true"><path d="M8 36h104v-6c0-3-2-5-5-6l-18-4-14-10H38L22 20l-10 3c-3 1-4 3-4 6v7z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="38" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="88" cy="38" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg><span>Photos coming soon</span></div>`;
  const title = c => `${c.year} ${c.make} ${c.model}`;

  function card(c) {
    const img = c.photos && c.photos.length ? `<img src="${c.photos[0]}" alt="${title(c)}" loading="lazy" />` : placeholder;
    const badge = c.status && c.status !== "Available" ? `<span class="badge">${c.status}</span>` : "";
    return `<article class="car" data-id="${c.id}" tabindex="0" role="button" aria-label="View ${title(c)}">
      <div class="car-media">${img}${badge}</div>
      <div class="car-body">
        <div class="car-top"><h3>${title(c)}</h3><span class="price">${money(c.price)}</span></div>
        <p class="trim">${c.trim || ""}</p>
        <ul class="specs"><li>${c.miles.toLocaleString("en-US")} mi</li><li>${c.trans}</li><li>${c.drive}</li></ul>
      </div>
    </article>`;
  }

  const grid = $("#inventoryGrid");
  function render(filter) {
    const list = filter === "all" ? INV : INV.filter(c => c.type === filter);
    grid.innerHTML = list.length ? list.map(card).join("") : `<p class="muted">No vehicles in this category right now.</p>`;
  }
  render("all");
  $$(".chip").forEach(b => b.addEventListener("click", () => {
    $$(".chip").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    render(b.dataset.filter);
  }));

  // Modal
  const modal = $("#carModal"), body = $("#modalBody");
  function openCar(id) {
    const c = INV.find(x => String(x.id) === String(id));
    if (!c) return;
    const photos = c.photos && c.photos.length
      ? `<div class="gallery"><img id="galMain" src="${c.photos[0]}" alt="${title(c)}" />${c.photos.length > 1 ? `<div class="thumbs">${c.photos.map((p, i) => `<img src="${p}" data-i="${i}" alt="" />`).join("")}</div>` : ""}</div>`
      : `<div class="gallery">${placeholder}</div>`;
    body.innerHTML = `${photos}
      <div class="modal-info">
        <h2 id="modalTitle">${title(c)} <span class="muted">${c.trim || ""}</span></h2>
        <p class="price big">${money(c.price)}</p>
        <dl class="spec-table">
          <dt>Mileage</dt><dd>${c.miles.toLocaleString("en-US")} mi</dd>
          <dt>Body</dt><dd>${c.type}</dd>
          <dt>Transmission</dt><dd>${c.trans}</dd>
          <dt>Drivetrain</dt><dd>${c.drive}</dd>
          <dt>Color</dt><dd>${c.color}</dd>
          <dt>Status</dt><dd>${c.status}</dd>
        </dl>
        <div class="hero-cta">
          <a class="btn btn-primary" href="tel:${S.phoneE164}">Call About This Car</a>
          <a class="btn btn-ghost" href="#contact" data-close data-ask="${title(c)}">Request Test Drive</a>
        </div>
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $$(".thumbs img", body).forEach(t => t.addEventListener("click", () => ($("#galMain").src = c.photos[t.dataset.i])));
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }
  grid.addEventListener("click", e => { const el = e.target.closest(".car"); if (el) openCar(el.dataset.id); });
  grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("car")) { e.preventDefault(); openCar(e.target.dataset.id); } });
  modal.addEventListener("click", e => {
    const t = e.target.closest("[data-close]");
    if (!t) return;
    if (t.dataset.ask) {
      $("#topicSelect").value = "Test drive";
      $("#contactForm textarea").value = `I'd like to schedule a test drive for the ${t.dataset.ask}.`;
    }
    closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  // Lot gallery lightbox
  const lb = $("#lightbox"), lbImg = $("img", lb), gal = $$("#lotGallery img");
  let lbIdx = 0;
  const showLb = i => { lbIdx = (i + gal.length) % gal.length; lbImg.src = gal[lbIdx].src; lbImg.alt = gal[lbIdx].alt; };
  gal.forEach((img, i) => img.addEventListener("click", () => { showLb(i); lb.hidden = false; document.body.style.overflow = "hidden"; }));
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
  lb.addEventListener("click", e => {
    if (e.target.closest(".lb-prev")) showLb(lbIdx - 1);
    else if (e.target.closest(".lb-next")) showLb(lbIdx + 1);
    else if (e.target !== lbImg) closeLb();
  });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIdx - 1);
    if (e.key === "ArrowRight") showLb(lbIdx + 1);
  });

  // Payment calculator
  const calc = () => {
    const p = +$("#cPrice").value || 0, d = +$("#cDown").value || 0, r = (+$("#cRate").value || 0) / 1200, n = +$("#cTerm").value;
    const P = Math.max(p - d, 0);
    const m = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
    $("#cOut").textContent = money(m) + "/mo";
  };
  $$("#calc input, #calc select").forEach(i => i.addEventListener("input", calc));
  calc();

  // Contact form (hidden unless enabled in site-config.js)
  if (S.showContactForm) {
    $("#contactForm").hidden = false;
    $("#contactSplit").classList.remove("no-form");
  }

  // Contact form -> mailto
  $("#contactForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const subj = `Website inquiry: ${f.get("topic")}`;
    const lines = [`Name: ${f.get("name")}`, `Phone: ${f.get("phone")}`, `Email: ${f.get("email")}`, "", f.get("message")];
    location.href = `mailto:${S.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
})();
