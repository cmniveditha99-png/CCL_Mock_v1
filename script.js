document.addEventListener("DOMContentLoaded", async () => {
  const preview = document.getElementById("preview");
  const videoCard = document.getElementById("videoCard");

  const statusMsg = document.getElementById("statusMsg");

  const btnStartMain = document.getElementById("btnStartMain");
  const btnFinish = document.getElementById("btnFinish");

  const pillPlaying = document.getElementById("pillPlaying");
  const pillREC = document.getElementById("pillREC");

  const attemptsEl = document.getElementById("attempts");
  const segHeader = document.querySelector(".segHeader");

  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  const tLeft = document.getElementById("tLeft");
  const tRight = document.getElementById("tRight");

  const waveCanvas = document.getElementById("waveCanvas");
  const recCanvas = document.getElementById("recCanvas");
  const wctx = waveCanvas.getContext("2d");
  const rctx = recCanvas.getContext("2d");

  // ==========================
  // LOGIN GATE (NEW)
  // ==========================
  let CANDIDATE = null; // { fullName, email, whatsapp, folder }

  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const fullNameEl = document.getElementById("fullName");
  const emailEl = document.getElementById("email");
  const whatsappEl = document.getElementById("whatsapp");

  function slugifyName(name) {
    return (name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 60);
  }

  function setLoginError(msg) {
    if (!loginError) return;
    loginError.textContent = msg || "";
    loginError.style.display = msg ? "block" : "none";
  }

  function showLogin() {
    if (!loginOverlay) return;
    loginOverlay.style.display = "flex";
  }

  function hideLogin() {
    if (!loginOverlay) return;
    loginOverlay.style.display = "none";
  }

  function loadCandidateFromStorage() {
    try {
      const raw = localStorage.getItem("ccl_candidate");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj?.fullName || !obj?.email || !obj?.whatsapp || !obj?.folder) return null;
      return obj;
    } catch {
      return null;
    }
  }

  function saveCandidateToStorage(candidate) {
    localStorage.setItem("ccl_candidate", JSON.stringify(candidate));
  }
// ==========================
// UPLOAD OVERLAY (NEW)
// ==========================
let isUploading = false;

const uploadOverlay = document.createElement("div");
uploadOverlay.className = "cclUploadOverlay";
uploadOverlay.style.display = "none";
uploadOverlay.innerHTML = `
  <div class="cclUploadBox">
    <div class="cclUploadSpinner"></div>
    <div class="cclUploadTitle" id="cclUploadTitle">Uploading your audio…</div>
    <div class="cclUploadPct" id="cclUploadPct">0%</div>
    <div class="cclUploadBar">
      <div class="cclUploadBarFill" id="cclUploadBarFill" style="width:0%"></div>
    </div>
    <div class="cclUploadHint">Please don’t close or navigate away.</div>
  </div>
`;
document.body.appendChild(uploadOverlay);

const cclUploadTitle = uploadOverlay.querySelector("#cclUploadTitle");
const cclUploadPct = uploadOverlay.querySelector("#cclUploadPct");
const cclUploadBarFill = uploadOverlay.querySelector("#cclUploadBarFill");

function setNavDisabled(disabled) {
  btnNext.disabled = disabled;
  btnPrev.disabled = disabled;
  btnStartMain.disabled = disabled;
  btnFinish.disabled = disabled;
}

function showUploadOverlay(pct, title) {
  if (title) cclUploadTitle.textContent = title;
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  cclUploadPct.textContent = `${p}%`;
  cclUploadBarFill.style.width = `${p}%`;
  uploadOverlay.style.display = "flex";
}

function hideUploadOverlay(finalTitle) {
  if (finalTitle) cclUploadTitle.textContent = finalTitle;
  setTimeout(() => {
    uploadOverlay.style.display = "none";
    cclUploadTitle.textContent = "Uploading your audio…";
    cclUploadPct.textContent = "0%";
    cclUploadBarFill.style.width = "0%";
  }, 500);
}

  // --- transition overlay ---
  const transitionOverlay = document.createElement("div");
  transitionOverlay.className = "cclTransition";
  document.body.appendChild(transitionOverlay);

  const pageRoot = document.querySelector("main.page") || document.body;

  async function runTransition() {
    transitionOverlay.classList.add("on");
    pageRoot.classList.add("cclBlur");
    await new Promise((r) => setTimeout(r, 120));
    transitionOverlay.classList.remove("on");
    pageRoot.classList.remove("cclBlur");
    await new Promise((r) => setTimeout(r, 60));
  }

  // ------- your audio list -------
  const DEFAULT_SEGMENTS = [
    { id: "seg01", title: "Segment 1", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project01.mp3" },
    { id: "seg02", title: "Segment 2", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project02.mp3" },
    { id: "seg03", title: "Segment 3", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project03.mp3" },
    { id: "seg04", title: "Segment 4", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project04.mp3" },
    { id: "seg05", title: "Segment 5", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project05.mp3" },
    { id: "seg06", title: "Segment 6", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project06.mp3" },
    { id: "seg07", title: "Segment 7", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project07.mp3" },
    { id: "seg08", title: "Segment 8", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project08.mp3" },
    { id: "seg09", title: "Segment 9", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project09.mp3" },
    { id: "seg10", title: "Segment 10", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project10.mp3" },
    { id: "seg11", title: "Segment 11", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project11.mp3" },
    { id: "seg12", title: "Segment 12", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project12.mp3" },
    { id: "seg13", title: "Segment 13", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project13.mp3" },
    { id: "seg14", title: "Segment 14", audioUrl: "https://pub-15435c2c49624fce863d237aeb26f8b7.r2.dev/Education-School%20Camp/Default%20Project14.mp3" }
  ];

   // If a mock config is loaded (window.CCL_MOCK.segments), use it.
  // Otherwise fall back to DEFAULT_SEGMENTS (so your current site still works even without a config file).
  const SEGMENTS =
    (window.CCL_MOCK && Array.isArray(window.CCL_MOCK.segments) && window.CCL_MOCK.segments.length)
      ? window.CCL_MOCK.segments
      : DEFAULT_SEGMENTS;

  // ------- state -------
  let currentIndex = 0;

  // attempts should be PER SEGMENT
  const attemptsBySegId = new Map();          // segId -> number
  const finishedOnceBySegId = new Map();      // segId -> boolean

  // ===== END FLOW STATE (NEW) =====
  const openedBySegId = new Map();            // segId -> true once opened
  const answeredBySegId = new Map();          // segId -> true once uploaded successfully
  let inEndFlow = false;

  // audio playback element
  const sourceAudio = new Audio();
  sourceAudio.preload = "auto";
  sourceAudio.crossOrigin = "anonymous";

  // audio decoding for waveform
  let audioCtx = null;
  let decodedBuffer = null;
  // ===== PRELOAD CACHE (NEW) =====
const decodedCache = new Map(); // audioUrl -> AudioBuffer
const preloadJobs = new Map();  // audioUrl -> Promise<AudioBuffer>


  // playback animation
  let playRAF = null;

  // recording animation
  let recRAF = null;
  let recStartTs = 0;

  // mic stream + recorder (we record mic only)
  let micStream = null;
  let mediaRecorder = null;
  let recChunks = [];
  let isRecording = false;

  // ------- modal (no HTML changes needed) -------
  const modal = createRepeatModal();

  function createRepeatModal() {
    const style = document.createElement("style");
    style.textContent = `
      .cclModalOverlay{
        position:fixed; inset:0;
        background: rgba(0,0,0,.25);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:9999;
      }
      .cclModal{
        width:min(520px, 92vw);
        background:#fff;
        border-radius:10px;
        box-shadow:0 24px 60px rgba(0,0,0,.22);
        padding:28px 26px 22px;
        position:relative;
        text-align:center;
      }
      .cclModalX{
        position:absolute;
        right:14px; top:12px;
        border:none; background:transparent;
        font-size:22px; cursor:pointer;
        color:#111827;
      }
      .cclModalIcon{
        width:86px; height:86px;
        border-radius:999px;
        background:#f3f4f6;
        margin:0 auto 14px;
        display:flex; align-items:center; justify-content:center;
        font-size:42px;
        color:#f59e0b;
      }
      .cclModalText{
        font-size:22px;
        color:#4b5563;
        margin:8px 0 18px;
      }
      .cclModalActions{
        display:flex;
        justify-content:center;
        gap:26px;
        margin-top:12px;
      }
      .cclModalCancel{
        background:transparent;
        border:none;
        font-weight:700;
        color:#374151;
        cursor:pointer;
        padding:10px 16px;
      }
      .cclModalOk{
        background:#0f8b83;
        border:none;
        color:#fff;
        font-weight:800;
        border-radius:999px;
        padding:12px 28px;
        cursor:pointer;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "cclModalOverlay";
    overlay.innerHTML = `
      <div class="cclModal" role="dialog" aria-modal="true" aria-label="Repeat segment confirmation">
        <button class="cclModalX" aria-label="Close">×</button>
        <div class="cclModalIcon">⚠️</div>
        <div class="cclModalText">Are you sure you want to repeat the segment?</div>
        <div class="cclModalActions">
          <button class="cclModalCancel">Cancel</button>
          <button class="cclModalOk">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => (overlay.style.display = "none");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".cclModalX").addEventListener("click", close);

    const open = () => (overlay.style.display = "flex");

    const ask = () =>
      new Promise((resolve) => {
        open();

        const btnCancel = overlay.querySelector(".cclModalCancel");
        const btnOk = overlay.querySelector(".cclModalOk");

        const cleanup = () => {
          btnCancel.removeEventListener("click", onCancel);
          btnOk.removeEventListener("click", onOk);
        };

        const onCancel = () => {
          cleanup();
          close();
          resolve(false);
        };
        const onOk = () => {
          cleanup();
          close();
          resolve(true);
        };

        btnCancel.addEventListener("click", onCancel);
        btnOk.addEventListener("click", onOk);
      });

    return { ask, close };
  }

  // ==========================
  // END FLOW UI (NEW)
  // ==========================
  const endFlow = createEndFlowUI();

  function createEndFlowUI() {
    const style = document.createElement("style");
    style.textContent = `
      .cclEndOverlay{
        position:fixed; inset:0;
        background: rgba(255,255,255,0.96);
        z-index:9998;
        display:none;
      }
      .cclEndInner{
        max-width:1100px;
        margin:0 auto;
        padding:64px 56px;
        font-family:inherit;
      }
      .cclEndTitle{
        color:#0f8b83;
        font-weight:800;
        letter-spacing:.02em;
        margin-bottom:34px;
      }
      .cclEndText{
        color:#111827;
        font-size:18px;
        line-height:1.8;
        max-width:900px;
      }
      .cclEndBottom{
        position:fixed;
        left:0; right:0; bottom:0;
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:18px 40px;
        background:#fff;
        border-top:1px solid #e5e7eb;
      }
      .cclEndBtnPrev{
        background:transparent;
        border:none;
        font-size:16px;
        font-weight:700;
        cursor:pointer;
        color:#111827;
      }
      .cclEndBtnFinish{
        background:#b30000;
        border:none;
        color:#fff;
        font-weight:800;
        border-radius:999px;
        padding:12px 24px;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:10px;
      }
      .cclEndBtnFinish:before{
        content:"🏁";
        font-size:16px;
      }

      .cclSummaryOverlay{
        position:fixed; inset:0;
        background: rgba(0,0,0,.25);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:9999;
      }
      .cclSummaryModal{
        width:min(720px, 92vw);
        background:#fff;
        border-radius:10px;
        box-shadow:0 24px 60px rgba(0,0,0,.22);
        overflow:hidden;
      }
      .cclSummaryHead{
        padding:18px 20px;
        border-bottom:1px solid #e5e7eb;
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
      }
      .cclSummaryHead h2{
        margin:0;
        font-size:34px;
        font-weight:800;
        color:#111827;
      }
      .cclSummaryHead p{
        margin:8px 0 0;
        color:#6b7280;
        font-size:16px;
      }
      .cclSummaryClose{
        border:none;
        background:transparent;
        font-size:22px;
        cursor:pointer;
        color:#111827;
        padding:4px 8px;
      }
      .cclSummaryList{
        max-height:420px;
        overflow:auto;
      }
      .cclRow{
        display:grid;
        grid-template-columns: 1fr 260px;
        gap:10px;
        padding:16px 18px;
        border-bottom:1px solid #f1f5f9;
        cursor:pointer;
      }
      .cclRow:hover{ background:#f3f4f6; }
      .cclRowLeft{
        display:flex;
        align-items:center;
        gap:12px;
        font-weight:600;
        color:#111827;
      }
      .cclDot{
        width:16px;height:16px;
        border-radius:999px;
        border:2px solid #6b7280;
        display:inline-block;
      }
      .cclDot.answered{
        border-color:#111827;
        background:#111827;
      }
      .cclRowRight{
        color:#6b7280;
        text-align:right;
        font-weight:600;
      }
      .cclRow.info{
        cursor:default;
      }
      .cclRow.info:hover{ background:transparent; }
      .cclSummaryActions{
        padding:16px 18px;
        display:flex;
        justify-content:flex-end;
        gap:22px;
        align-items:center;
        background:#fff;
      }
      .cclBtnCancel{
        background:transparent;
        border:none;
        font-weight:800;
        color:#111827;
        cursor:pointer;
        padding:10px 14px;
      }
      .cclBtnOk{
        background:#0f8b83;
        border:none;
        color:#fff;
        font-weight:900;
        border-radius:999px;
        padding:12px 26px;
        cursor:pointer;
      }

      .cclThanksOverlay{
        position:fixed; inset:0;
        background: rgba(0,0,0,.25);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:10000;
      }
      .cclThanksModal{
        width:min(640px, 92vw);
        background:#fff;
        border-radius:10px;
        box-shadow:0 24px 60px rgba(0,0,0,.22);
        padding:34px 28px 28px;
        text-align:center;
      }
      .cclThanksModal h2{
        margin:0 0 10px;
        font-size:34px;
        font-weight:800;
        color:#111827;
      }
      .cclThanksModal p{
        margin:0 0 22px;
        color:#4b5563;
        font-size:16px;
        line-height:1.6;
      }
      .cclThanksClose{
        background:#0f8b83;
        border:none;
        color:#fff;
        font-weight:900;
        border-radius:999px;
        padding:12px 28px;
        cursor:pointer;
      }
    `;
    document.head.appendChild(style);

    // END PAGE
    const endOverlay = document.createElement("div");
    endOverlay.className = "cclEndOverlay";
    endOverlay.innerHTML = `
      <div class="cclEndInner">
        <div class="cclEndTitle">END OF PRACTICE DIALOGUE</div>
        <div class="cclEndText">
          <p>Please click on <b>Finish</b> at the bottom of the screen to end the practice test.</p>
          <p>You will be shown a list of the dialogue segments.</p>
          <p>Please make sure every segment is marked "<b>Answered</b>".</p>
          <p>If "<b>Not answered</b>", you must click on the segment to properly complete it.</p>
          <br />
          <p>Once finished, please click "<b>Confirm</b>".</p>
        </div>
      </div>

      <div class="cclEndBottom">
        <button class="cclEndBtnPrev">← Previous</button>
        <button class="cclEndBtnFinish">Finish</button>
      </div>
    `;
    document.body.appendChild(endOverlay);

    // SUMMARY MODAL
    const summaryOverlay = document.createElement("div");
    summaryOverlay.className = "cclSummaryOverlay";
    summaryOverlay.innerHTML = `
      <div class="cclSummaryModal" role="dialog" aria-modal="true">
        <div class="cclSummaryHead">
          <div>
            <h2>End of dialogue</h2>
            <p class="cclSummaryCount"></p>
          </div>
          <button class="cclSummaryClose" aria-label="Close">×</button>
        </div>
        <div class="cclSummaryList"></div>
        <div class="cclSummaryActions">
          <button class="cclBtnCancel">Cancel</button>
          <button class="cclBtnOk">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(summaryOverlay);

    // THANK YOU MODAL
    const thanksOverlay = document.createElement("div");
    thanksOverlay.className = "cclThanksOverlay";
    thanksOverlay.innerHTML = `
      <div class="cclThanksModal" role="dialog" aria-modal="true">
        <h2>Session finished</h2>
        <p>Thank you for completing the NAATI CCL Practice test.</p>
        <button class="cclThanksClose">Close</button>
      </div>
    `;
    document.body.appendChild(thanksOverlay);

    // wiring
    const btnPrevEnd = endOverlay.querySelector(".cclEndBtnPrev");
    const btnFinishEnd = endOverlay.querySelector(".cclEndBtnFinish");
    const closeSummary = summaryOverlay.querySelector(".cclSummaryClose");
    const listEl = summaryOverlay.querySelector(".cclSummaryList");
    const countEl = summaryOverlay.querySelector(".cclSummaryCount");
    const cancelBtn = summaryOverlay.querySelector(".cclBtnCancel");
    const okBtn = summaryOverlay.querySelector(".cclBtnOk");
    const thanksClose = thanksOverlay.querySelector(".cclThanksClose");

    function showEndPage() {
      inEndFlow = true;
      endOverlay.style.display = "block";
    }

    function hideEndPage() {
      endOverlay.style.display = "none";
      inEndFlow = false;
    }

    function buildSummary() {
      // Count unanswered among SEGMENTS only
      let unanswered = 0;
      for (const s of SEGMENTS) {
        const answered = answeredBySegId.get(s.id) === true;
        if (!answered) unanswered++;
      }
      countEl.textContent = `You have ${unanswered} unanswered segment(s).`;

      listEl.innerHTML = "";

      // optional info rows like NAATI modal
      const info1 = document.createElement("div");
      info1.className = "cclRow info";
      info1.innerHTML = `
        <div class="cclRowLeft"><span class="cclDot"></span> Information 1</div>
        <div class="cclRowRight">--</div>
      `;
      listEl.appendChild(info1);

      const info2 = document.createElement("div");
      info2.className = "cclRow info";
      info2.innerHTML = `
        <div class="cclRowLeft"><span class="cclDot"></span> Information 2</div>
        <div class="cclRowRight">--</div>
      `;
      listEl.appendChild(info2);

      // segment rows
      SEGMENTS.forEach((s, idx) => {
        const opened = openedBySegId.get(s.id) === true;
        const answered = answeredBySegId.get(s.id) === true;

        const row = document.createElement("div");
        row.className = "cclRow";
        row.innerHTML = `
          <div class="cclRowLeft">
            <span class="cclDot ${answered ? "answered" : ""}"></span>
            ${s.title}
          </div>
          <div class="cclRowRight">
            ${answered ? "Answered" : (opened ? "Opened, but not answered" : "Opened, but not answered")}
          </div>
        `;

        row.addEventListener("click", async () => {
          summaryOverlay.style.display = "none";
          endOverlay.style.display = "none";
          inEndFlow = false;
          await runTransition();
          currentIndex = idx;
          await loadSegment(currentIndex);
        });

        listEl.appendChild(row);
      });
    }

    function showSummary() {
      buildSummary();
      summaryOverlay.style.display = "flex";
    }

    function showThanks() {
      summaryOverlay.style.display = "none";
      endOverlay.style.display = "none";
      thanksOverlay.style.display = "flex";
    }

    function hideThanks() {
      thanksOverlay.style.display = "none";
    }

    btnPrevEnd.addEventListener("click", async () => {
      hideEndPage();
      await runTransition();
      // return to last segment page (currentIndex already last)
      await loadSegment(currentIndex);
    });

    btnFinishEnd.addEventListener("click", () => {
      // step2: show scrollable summary
      showSummary();
    });

    closeSummary.addEventListener("click", () => (summaryOverlay.style.display = "none"));
    cancelBtn.addEventListener("click", () => (summaryOverlay.style.display = "none"));

    okBtn.addEventListener("click", () => {
      // step3: show thank you
      showThanks();
    });

    thanksClose.addEventListener("click", () => {
      hideThanks();
      // optionally stay blank, or keep endFlow finished
    });

    // clicking outside summary closes it (like NAATI)
    summaryOverlay.addEventListener("click", (e) => {
      if (e.target === summaryOverlay) summaryOverlay.style.display = "none";
    });

    return { showEndPage };
  }

  // ------- helpers -------
  const fmtTime = (seconds) => {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  function stopAnim() {
    if (playRAF) cancelAnimationFrame(playRAF);
    playRAF = null;
    if (recRAF) cancelAnimationFrame(recRAF);
    recRAF = null;
  }

  function uiIdle() {
    pillPlaying.style.display = "none";
    pillREC.style.display = "none";
    videoCard.classList.remove("isRec");

    btnStartMain.style.display = "inline-flex";
    btnFinish.style.display = "none";
    btnFinish.disabled = true;

    statusMsg.textContent = "";
  }

  function uiPlaying() {
    pillPlaying.style.display = "inline-flex";
    pillREC.style.display = "none";
    videoCard.classList.remove("isRec");

    btnStartMain.style.display = "none";
    btnFinish.style.display = "inline-flex";
    btnFinish.disabled = true;
  }

  function uiRecording() {
    pillPlaying.style.display = "none";
    pillREC.style.display = "inline-flex";
    videoCard.classList.add("isRec");

    btnStartMain.style.display = "none";
    btnFinish.style.display = "inline-flex";
    btnFinish.disabled = false;
  }

  function pickMimeType() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"];
    for (const t of types) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  }

  // ------- drawing: waveform + playhead -------
  function drawWaveform(buffer) {
    const W = waveCanvas.width;
    const H = waveCanvas.height;

    wctx.clearRect(0, 0, W, H);
    wctx.fillStyle = "#f4f6f8";
    wctx.fillRect(0, 0, W, H);

    wctx.fillStyle = "#fca5a5";
    wctx.fillRect(W - 12, 0, 12, H);

    wctx.fillStyle = "#0f8b83";
    wctx.fillRect(12, 8, 4, H - 16);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / W);
    const amp = H / 2;

    wctx.strokeStyle = "#c0c7d2";
    wctx.lineWidth = 1;
    wctx.beginPath();

    for (let x = 0; x < W; x++) {
      let min = 1.0, max = -1.0;
      const start = x * step;
      const end = Math.min(start + step, data.length);

      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }

      wctx.moveTo(x, (1 + min) * amp);
      wctx.lineTo(x, (1 + max) * amp);
    }
    wctx.stroke();

    wctx.strokeStyle = "#e3e7ee";
    wctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  function drawPlayhead(progress01) {
    if (!decodedBuffer) return;
    drawWaveform(decodedBuffer);

    const W = waveCanvas.width;
    const H = waveCanvas.height;
    const x = Math.max(0, Math.min(1, progress01)) * W;

    wctx.strokeStyle = "#111827";
    wctx.lineWidth = 2;
    wctx.beginPath();
    wctx.moveTo(x, 0);
    wctx.lineTo(x, H);
    wctx.stroke();
  }

  // ------- drawing: recording bar fill -------
  function resetRecCanvas() {
    const W = recCanvas.width;
    const H = recCanvas.height;

    rctx.clearRect(0, 0, W, H);
    rctx.fillStyle = "#ffffff";
    rctx.fillRect(0, 0, W, H);

    rctx.strokeStyle = "#e3e7ee";
    rctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    rctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
    rctx.lineWidth = 2;
    rctx.beginPath();
    rctx.moveTo(0, Math.floor(H / 2));
    rctx.lineTo(W, Math.floor(H / 2));
    rctx.stroke();
  }

  function drawRecProgress(progress01) {
    resetRecCanvas();
    const W = recCanvas.width;
    const H = recCanvas.height;

    const p = Math.max(0, Math.min(1, progress01));
    const fillW = Math.floor(W * p);

    rctx.fillStyle = "rgba(239, 68, 68, 0.18)";
    rctx.fillRect(W - fillW, 0, fillW, H);

    rctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
    rctx.lineWidth = 2;
    rctx.beginPath();
    rctx.moveTo(W - fillW, Math.floor(H / 2));
    rctx.lineTo(W, Math.floor(H / 2));
    rctx.stroke();

    rctx.strokeStyle = "#e3e7ee";
    rctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  // ------- audio decode for waveform -------
  async function fetchAndDecode(url) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Audio fetch failed");
    const buf = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(buf);
  }
  
  async function getDecoded(url) {
  // 1) Already cached
  if (decodedCache.has(url)) return decodedCache.get(url);

  // 2) In-flight job
  if (preloadJobs.has(url)) return await preloadJobs.get(url);

  // 3) Start a new decode job
  const job = (async () => {
    const buf = await fetchAndDecode(url);
    decodedCache.set(url, buf);
    return buf;
  })();

  preloadJobs.set(url, job);

  try {
    return await job;
  } finally {
    preloadJobs.delete(url);
  }
}

function preloadDecode(url) {
  // Fire-and-forget preload (safe)
  getDecoded(url).catch(() => {});
}


  function currentSegId() {
    return SEGMENTS[currentIndex].id;
  }

  function getAttemptsForCurrent() {
    return attemptsBySegId.get(currentSegId()) || 0;
  }

  function setAttemptsForCurrent(n) {
    attemptsBySegId.set(currentSegId(), n);
    attemptsEl.textContent = String(n);
  }

  function getFinishedOnceForCurrent() {
    return finishedOnceBySegId.get(currentSegId()) || false;
  }

  function setFinishedOnceForCurrent(v) {
    finishedOnceBySegId.set(currentSegId(), v);
  }

  // ------- segment load -------
  async function loadSegment(idx) {

    btnStartMain.disabled = true;
statusMsg.textContent = "Loading audio…";

    stopAnim();
    uiIdle();

    sourceAudio.pause();
    sourceAudio.currentTime = 0;

    decodedBuffer = null;
    resetRecCanvas();

    const segNumber = idx + 1;
    const total = SEGMENTS.length;

    segHeader.textContent = `Segment ${segNumber}`;
    progressText.textContent = `${segNumber}/${total}`;
    progressFill.style.width = `${(segNumber / total) * 100}%`;

    btnPrev.disabled = idx === 0;
    btnNext.disabled = false; // keep enabled even on last segment so it can go to End page


    // ===== mark opened (NEW) =====
    openedBySegId.set(SEGMENTS[idx].id, true);

    setAttemptsForCurrent(getAttemptsForCurrent());
    tLeft.textContent = "0:00";
    tRight.textContent = "0:00";

    const seg = SEGMENTS[idx];
    sourceAudio.src = seg.audioUrl;
    sourceAudio.load();

    try {
  decodedBuffer = await getDecoded(seg.audioUrl);   // ✅ uses cache / preload
  btnStartMain.disabled = false;
statusMsg.textContent = "";

  drawWaveform(decodedBuffer);
  tRight.textContent = fmtTime(decodedBuffer.duration);
} catch (e) {
  console.error(e);
  statusMsg.textContent = "Audio failed to load. Check the link / CORS.";
  wctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
  wctx.fillStyle = "#f4f6f8";
  wctx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
}

// ✅ Preload the NEXT segment in background to remove delay
const next = SEGMENTS[idx + 1];
if (next?.audioUrl) preloadDecode(next.audioUrl);


  }

  // ------- Step 2: play with playhead + playing badge -------
  async function startPlaybackFresh() {
    if (!decodedBuffer) {
      statusMsg.textContent = "Audio not ready.";
      return;
    }

    uiPlaying();
    resetRecCanvas();
    statusMsg.textContent = "";

    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    sourceAudio.currentTime = 0;

    try {
      await sourceAudio.play();
    } catch (e) {
      console.error(e);
      statusMsg.textContent = "Playback blocked. Click Start again.";
      uiIdle();
      return;
    }

    const tick = () => {
      const dur = decodedBuffer.duration || 0;
      const ct = sourceAudio.currentTime || 0;
      tLeft.textContent = fmtTime(ct);
      drawPlayhead(dur ? (ct / dur) : 0);

      if (!sourceAudio.paused && !sourceAudio.ended) {
        playRAF = requestAnimationFrame(tick);
      }
    };
    playRAF = requestAnimationFrame(tick);
  }

  // CHANGE THIS to your deployed Worker URL:
  const UPLOAD_ENDPOINT = "https://dawn-leaf-c072.cm-niveditha99.workers.dev/";

function uploadRecordingToR2({ blob, segmentId, attempt, filename, onProgress }) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, filename);
    fd.append("segmentId", segmentId);
    fd.append("attempt", String(attempt));
    fd.append("filename", filename);

    if (CANDIDATE?.folder) fd.append("candidateFolder", CANDIDATE.folder);
    if (CANDIDATE?.fullName) fd.append("fullName", CANDIDATE.fullName);
    if (CANDIDATE?.email) fd.append("email", CANDIDATE.email);
    if (CANDIDATE?.whatsapp) fd.append("whatsapp", CANDIDATE.whatsapp);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_ENDPOINT, true);

    xhr.upload.onprogress = (e) => {
      if (!onProgress) return;
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText || "{}"));
        } catch {
          resolve({});
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText || ""}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed (network error)."));
    xhr.send(fd);
  });
}


  // ------- Step 3: auto record + REC badge + red progress -------
  function startRecordingAuto() {
    if (!micStream) {
      statusMsg.textContent = "Mic not available.";
      uiIdle();
      return;
    }

    uiRecording();
    recStartTs = performance.now();
    isRecording = true;
    recChunks = [];

    try {
      mediaRecorder = new MediaRecorder(micStream, { mimeType: pickMimeType() });
    } catch {
      mediaRecorder = new MediaRecorder(micStream);
    }

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recChunks.push(ev.data);
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      uiIdle();
      videoCard.classList.remove("isRec");

      const blob = new Blob(recChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const seg = SEGMENTS[currentIndex];
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const ext = blob.type.includes("ogg") ? "ogg" : (blob.type.includes("mp4") ? "m4a" : "webm");
      const filename = `${seg.id}_${ts}.${ext}`;

      statusMsg.textContent = "Uploading…";

statusMsg.textContent = "Uploading…";
isUploading = true;
setNavDisabled(true);
showUploadOverlay(0, "Uploading your audio…");

try {
  await uploadRecordingToR2({
    blob,
    segmentId: seg.id,
    attempt: getAttemptsForCurrent(),
    filename,
    onProgress: (pct) => {
      showUploadOverlay(pct, "Uploading your audio…");
    }
  });

  // success
  showUploadOverlay(100, "Upload successful ✓");
  statusMsg.textContent = `Saved ✓ (uploaded)`;
  answeredBySegId.set(seg.id, true);
} catch (e) {
  console.error(e);
  statusMsg.textContent = "Upload failed. Check link / CORS.";
  showUploadOverlay(0, "Upload failed. Please try again.");
} finally {
  isUploading = false;
  setNavDisabled(false);
  hideUploadOverlay();
}


      setFinishedOnceForCurrent(true);
    };

    mediaRecorder.start(250);

    const recTick = () => {
      if (!isRecording) return;
      const elapsed = (performance.now() - recStartTs) / 1000;
      const maxSec = 60;
      drawRecProgress(Math.min(1, elapsed / maxSec));
      recRAF = requestAnimationFrame(recTick);
    };
    recRAF = requestAnimationFrame(recTick);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  // ------- Start button logic with confirmation -------
  async function handleStartClick() {
    stopAnim();
    if (isRecording) return;

    const attemptsNow = getAttemptsForCurrent();
    const hasFinished = getFinishedOnceForCurrent();

    if (attemptsNow === 0) {
      setAttemptsForCurrent(1);
      await startPlaybackFresh();
      return;
    }

    if (!hasFinished) {
      await startPlaybackFresh();
      return;
    }

    const ok = await modal.ask();
    if (!ok) return;

    setAttemptsForCurrent(attemptsNow + 1);
    await startPlaybackFresh();
  }

  // ------- events -------
  btnStartMain.addEventListener("click", handleStartClick);

  btnFinish.addEventListener("click", () => {
    stopAnim();
    stopRecording();
  });

  btnPrev.addEventListener("click", async () => {
    if (isUploading) return;

    if (inEndFlow) return;
    if (currentIndex > 0) {
      await runTransition();
      currentIndex -= 1;
      await loadSegment(currentIndex);
    }
  });

  // ===== UPDATED NEXT: last segment => end page (NEW) =====
  btnNext.addEventListener("click", async () => {
    if (isUploading) return;

    if (inEndFlow) return;

    if (currentIndex === SEGMENTS.length - 1) {
      // show end practice page
      await runTransition();
      endFlow.showEndPage();
      return;
    }

    if (currentIndex < SEGMENTS.length - 1) {
      await runTransition();
      currentIndex += 1;
      await loadSegment(currentIndex);
    }
  });

  sourceAudio.addEventListener("ended", () => {
    stopAnim();
    tLeft.textContent = fmtTime(decodedBuffer?.duration || 0);
    startRecordingAuto();
  });

  // ==========================
  // CAMERA/MIC + INIT START (CHANGED to occur AFTER login)
  // ==========================
  async function requestCameraMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      preview.srcObject = stream;
      micStream = new MediaStream(stream.getAudioTracks());
      statusMsg.textContent = "";
      return true;
    } catch (err) {
      console.error(err);
      statusMsg.textContent =
        "Camera/Mic blocked. Click the 🔒 lock icon near the URL → Site settings → Allow Camera & Microphone → Refresh.";
      return false;
    }
  }

  async function startAppAfterLogin() {
    resetRecCanvas();
    await loadSegment(currentIndex);
    setAttemptsForCurrent(0);
  }

  // ==========================
  // LOGIN FLOW (NEW)
  // ==========================
  CANDIDATE = null;

  const loginMissing =
    !loginOverlay || !loginForm || !fullNameEl || !emailEl || !whatsappEl || !loginError;

  if (loginMissing) {
    statusMsg.textContent =
      "Login form elements not found in HTML (loginOverlay/loginForm/fullName/email/whatsapp/loginError). Add them, then refresh.";
    await requestCameraMic();
    await startAppAfterLogin();
    return;
  }

  // IMPORTANT: show login on every load (as you requested)
  localStorage.removeItem("ccl_candidate");
  CANDIDATE = null;

  showLogin();
  uiIdle();
  resetRecCanvas();

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoginError("");

    const fullName = fullNameEl.value.trim();
    const email = emailEl.value.trim();
    const whatsapp = whatsappEl.value.trim();

    if (fullName.length < 3) return setLoginError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setLoginError("Please enter a valid email address.");
    if (whatsapp.replace(/\D/g, "").length < 8) return setLoginError("Please enter a valid WhatsApp number.");

    const folder = slugifyName(fullName) + "_" + email.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10);

    CANDIDATE = { fullName, email, whatsapp, folder };
    saveCandidateToStorage(CANDIDATE);

    hideLogin();

    await requestCameraMic();
    await startAppAfterLogin();
  });
});
