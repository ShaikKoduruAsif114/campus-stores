(() => {
  const storageKey = "campus-stores.shift.v2";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        holder: "Tara Shah",
        custody: [],
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    esc(title) +
    "</h2><small>" +
    esc(sub) +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const kit = CampusKit.kit(r, s.loans, assets);
      html += btn("Back to list", "close") +
        '<article class="record"><small>' + esc(r.id + ' · Approved') + '</small><h3>' + esc(r.event) +
        '</h3><p>' + esc(r.club + ' · Filed by ' + r.owner) + '</p><p>Original request return time: ' + esc(r.due) +
        '</p><p>' + esc(r.note) + '</p></article>' +
        '<div class="kit-summary">' + badge(kit.status, kit.status === 'Complete') +
        '<strong>' + kit.returned + ' of ' + kit.total + ' items returned</strong></div>';
      for (const l of s.loans.filter(l => l.req === r.id && !l.back)) html += '<p class="record"><strong>' +
        esc('Still out: ' + l.asset + ' · with ' + (l.holder || l.who) + ' · agreed return ' + l.due) + '</strong></p>';
      for (const line of kit.lines) {
        html += '<section class="kit-line"><h3>' + esc(line.type) + ' · 1 approved</h3>' + badge(line.state, line.state === 'Returned');
        for (const l of line.loans) html += row(l.asset + ' · L-' + l.num,
          l.back ? 'Returned to desk · Collected by ' + l.who : 'Outstanding · Collected by ' + l.who + ' · Holder: ' + (l.holder || l.who) + ' · Agreed return ' + l.due,
          loanActions(l));
        for (const l of line.loans) for (const c of l.custody || []) html += '<p class="custody-entry"><small>' +
          esc(shifts[c.phase].time + ' · ' + c.from + ' → ' + c.holder + ' · Agreed return ' + c.due + ' · ' + c.reason) + '</small></p>';
        if (!line.loans.length) html += '<p class="muted">No physical unit issued.</p>';
        html += '</section>';
      }
      html += btn('Issue for this request', 'issue-request', r.id, 'primary');
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club,
            badge(CampusKit.kit(r, s.loans, assets).status) + " " + btn("View kit", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const status = a.repair
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status + (out(a.id) ? " · " + (out(a.id).holder || out(a.id).who) : ""), status === "On shelf"),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        (s.issueRequest ? '<p class="record">' + esc(getReq(s.issueRequest).note) + '</p>' : '') +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown)
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · Collected by " + l.who + (l.back ? " · Returned to desk" : " · Holder: " + (l.holder || l.who) + " · Agreed return " + l.due),
        loanActions(l),
      );
    return html;
  }
  function loanActions(l) {
    return l.back ? badge('Returned by ' + (l.returnedBy || l.who), true) :
      '<div class="buttons">' + btn('Record return', 'return', l.num) + btn('Update holder / return time', 'custody', l.num) + '</div>';
  }
  function custodyForm() {
    const l = s.loans.find(l => l.num === s.custodyEditing && !l.back);
    if (!l) return '';
    return '<form data-custody class="record"><h3>Custody &amp; agreed return · ' + esc(l.asset) + ' · L-' + l.num +
      '</h3><p>Original collector: ' + esc(l.who) + '</p><div class="form">' +
      '<label><span>Current holder</span><select name="holder" required>' + opts(people.map(p => [p,p])) + '</select></label>' +
      '<label><span>Agreed return time</span><select name="due" required>' + opts(['Fri 8 pm','Sat 9 am','Sat 10 am','Sat noon'].map(d => [d,d])) + '</select></label>' +
      '<label class="full"><span>Reason / who confirmed this agreement</span><input name="reason" required maxlength="240"></label></div>' +
      '<div class="buttons"><button type="submit" class="primary">Save custody agreement</button>' + btn('Cancel agreement','cancel-custody') + '</div></form>';
  }
  function returnForm() {
    const l = s.loans.find(l => l.num === s.returning && !l.back);
    if (!l) return '';
    return '<form data-return class="record"><h3>Return check · L-' + l.num + ' · ' + esc(l.asset) +
      '</h3><p>Match the label on the physical unit. A different ID will not close this slip.</p><div class="form">' +
      '<label><span>Which unit is in your hand?</span><input name="asset" required autocomplete="off" placeholder="Read the unit ID"></label>' +
      '<label><span>Returned by</span><input name="returnedBy" required maxlength="80" autocomplete="off"></label></div>' +
      '<div class="buttons"><button class="primary" type="submit">Confirm return</button>' + btn('Cancel return', 'cancel-return') + '</div></form>';
  }
  function handoverCard(n) {
    if (!n) return '';
    let html = '<article class="record"><small>Snapshot · ' + esc(shifts[n.phase].time) + '</small><h3>Counter handover</h3>';
    if (n.text) html += '<p>' + esc(n.text) + '</p>';
    if (n.outstanding) {
      html += '<p class="muted">Recorded at handover; open the kit for live status.</p>';
      for (const l of n.outstanding) html += row(l.asset + ' · L-' + l.num,
        l.req + ' · Holder: ' + l.holder + ' · Agreed return ' + l.due,
        btn('Open kit', 'request', l.req));
      if (!n.outstanding.length) html += '<p>No outstanding loans at handover.</p>';
    }
    return html + '</article>';
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes.slice().reverse()) html += handoverCard(n);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Optional note for the next shift</span><textarea name="note" rows="2" maxlength="400"></textarea></label></div><button type="submit">Save handover snapshot</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  const drafts = new Map();
  let renderedContext = '';
  function paint() {
    const active = document.activeElement;
    const activeName = active?.getAttribute?.('name');
    const selection = activeName ? [active.selectionStart, active.selectionEnd] : null;
    const oldContext = renderedContext;
    for (const el of root.querySelectorAll('[data-page] [name]')) drafts.set(oldContext + ':' + el.name, el.value);
    if (activeName) drafts.set(oldContext + ':' + activeName, active.value);
    renderedContext = [s.tab, s.selected, s.editing, s.returning, s.custodyEditing].join('|');
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const previous = s.notes.filter(n => n.phase < s.phase).at(-1);
    q('[data-handover]').hidden = !previous;
    q('[data-handover]').innerHTML = handoverCard(previous);
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]() + returnForm() + custodyForm();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    if (s.editing && s.issueRequest) {
      q('[name="req"]').value = s.issueRequest;
      q('[name="due"]').value = getReq(s.issueRequest).due;
    }
    if (s.custodyEditing) {
      const l = s.loans.find(l => l.num === s.custodyEditing);
      if (l) { q('[data-custody] [name="holder"]').value = l.holder || l.who; q('[data-custody] [name="due"]').value = l.due; }
    }
    for (const el of root.querySelectorAll('[data-page] [name]')) {
      const value = drafts.get(renderedContext + ':' + el.name);
      if (value !== undefined) el.value = value;
    }
    if (activeName && oldContext === renderedContext) {
      const replacement = q('[name="' + activeName + '"]');
      if (replacement) {
        replacement.value = active.value;
        replacement.focus?.({preventScroll:true});
        if (selection && selection[0] !== null) replacement.setSelectionRange?.(...selection);
      }
    }
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        drafts.clear();
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.tab = "Requests";
        s.selected = v;
        break;
      case "issue-request":
        s.tab = "Loan register";
        s.editing = true;
        s.issueRequest = v;
        break;
      case "new":
        s.issueRequest = '';
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "custody":
        s.custodyEditing = Number(v);
        s.returning = null;
        break;
      case "cancel-custody":
        s.custodyEditing = null;
        break;
      case "cancel-return":
        s.returning = null;
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        s.custodyEditing = null;
        s.returning = l.num;
        s.notice = 'Read the physical unit ID before confirming the return.';
        break;
      }
    }
    commit();
    const focusTarget = {return:'[data-return] [name="asset"]',custody:'[data-custody] [name="holder"]','issue-request':'[data-issue] [name="asset"]',new:'[data-issue] [name="req"]'}[b.dataset.action];
    if (focusTarget) q(focusTarget)?.focus?.();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-custody]")) {
      const l = s.loans.find(l => l.num === s.custodyEditing && !l.back);
      const holder = String(form.get('holder')), due = String(form.get('due')), reason = String(form.get('reason')).trim();
      if (!l || !people.includes(holder) || !['Fri 8 pm','Sat 9 am','Sat 10 am','Sat noon'].includes(due) || !reason || reason.length > 240) {
        q('[data-status]').textContent = 'Choose a holder and agreed return time, and record who confirmed it.'; return;
      }
      l.custody = l.custody || [];
      l.custody.push({phase:s.phase, from:l.holder || l.who, holder, due, reason});
      l.holder = holder; l.due = due;
      s.custodyEditing = null;
      commit('Custody and agreed return recorded for ' + l.asset + '. Original collector retained.');
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find(l => l.num === s.returning && !l.back);
      if (!l) return;
      const asset = String(form.get('asset')).trim();
      const returnedBy = String(form.get('returnedBy')).trim();
      if (asset !== l.asset) { q('[data-status]').textContent = 'Unit mismatch: this slip is for ' + l.asset + '. No loan was closed. Find the matching slip.'; return; }
      if (!returnedBy || returnedBy.length > 80) { q('[data-status]').textContent = 'Record who returned this unit.'; return; }
      l.back = true; l.returnedBy = returnedBy; l.returnedAt = s.phase;
      s.returning = null;
      const complete = CampusKit.kit(getReq(l.req), s.loans, assets).status === 'Complete';
      commit(l.asset + ' returned by ' + returnedBy + '. Slip L-' + l.num + ' closed.' + (complete ? ' All equipment for ' + l.req + ' returned.' : ''));
      return;
    }
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (text.length > 400) return;
      const outstanding = s.loans.filter(l => !l.back).map(l => ({num:l.num, req:l.req, asset:l.asset, holder:l.holder || l.who, due:l.due}));
      s.notes.push({ phase: s.phase, text, outstanding });
      for (const el of root.querySelectorAll('[data-page] [name]')) el.value = '';
      drafts.clear();
      commit("Handover snapshot saved with " + outstanding.length + " outstanding units.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who) || !['Fri 8 pm','Sat 9 am','Sat 10 am','Sat noon'].includes(due)) {
      q('[data-status]').textContent = 'Choose an available unit, collector and valid return time.';
      return;
    }
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(400, ...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, holder: who, custody: [], due, back: false });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (!d || ![1,2].includes(d.version) || !Object.hasOwn(screens,d.tab) ||
      !Number.isInteger(d.phase) || !shifts[d.phase] || (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.loans) || !Array.isArray(d.notes)) return;
    const dueTimes = ['Fri 8 pm','Sat 9 am','Sat 10 am','Sat noon'];
    const validSnapshot = l => l && Number.isInteger(l.num) && getReq(l.req) && getAsset(l.asset) &&
      typeof l.holder === 'string' && people.includes(l.holder) && dueTimes.includes(l.due);
    const seen = new Set(), active = new Set();
    for (const l of d.loans) {
      if (!l || !Number.isInteger(l.num) || l.num < 1 || seen.has(l.num) || !getReq(l.req) ||
        !getAsset(l.asset) || getAsset(l.asset).repair || !getReq(l.req).items.includes(getAsset(l.asset).type) ||
        !people.includes(l.who) || !dueTimes.includes(l.due) || typeof l.back !== 'boolean') return;
      seen.add(l.num);
      if (!l.back) {
        const line = l.req + ':' + getAsset(l.asset).type;
        if (active.has(l.asset) || active.has(line)) return;
        active.add(l.asset); active.add(line);
      }
      if (d.version === 2 && (!people.includes(l.holder) || !Array.isArray(l.custody) ||
        !l.custody.every(c => c && Number.isInteger(c.phase) && shifts[c.phase] && people.includes(c.from) && people.includes(c.holder) && dueTimes.includes(c.due) && typeof c.reason === 'string' && c.reason.trim() && c.reason.length <= 240) ||
        (l.returnedBy !== undefined && (typeof l.returnedBy !== 'string' || !l.returnedBy.trim() || l.returnedBy.length > 80)) ||
        (l.returnedAt !== undefined && (!Number.isInteger(l.returnedAt) || !shifts[l.returnedAt])))) return;
    }
    if (!d.notes.every(n => n && Number.isInteger(n.phase) && shifts[n.phase] && typeof n.text === 'string' && n.text.length <= 400 &&
      (n.outstanding === undefined || (Array.isArray(n.outstanding) && n.outstanding.every(validSnapshot))))) return;
    s = {...original(), tab:d.tab, phase:d.phase, selected:d.selected || '',
      filter:['All items','On shelf','On loan','In repair'].includes(d.filter) ? d.filter : 'All items',
      onlyOpen: typeof d.onlyOpen === 'boolean' ? d.onlyOpen : true,
      loans:d.loans.map(l => ({...l,holder:l.holder || l.who,custody:l.custody || []})),
      notes:d.notes.map(n => ({...n}))};
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem("campus-stores.shift.v1")));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
