// ===== CALL AI =====
async function callClaude(prompt) {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000
      })
    });
    const data = await response.json();
    if (data.error) return "ERROR: " + data.error;
    return data.content?.[0]?.text || 'Tidak ada respon.';
  } catch (err) {
    console.error(err);
    return 'Terjadi kesalahan.';
  }
}

// ===== LOADING QUOTES =====
const loadingQuotes = [
  "Merangkai kata-kata untukmu",
  "Menulis di lembar perkamen",
  "Membuka halaman grimoire",
  "Menelusuri lorong cerita",
  "Menyulam benang narasi",
  "Mencelupkan pena ke tinta",
  "Membaca antara baris-baris",
  "Mengukir karakter di batu",
  "Memanggil ilham dari kegelapan",
  "Menulis takdir para tokoh",
];

let loadingInterval = null;
let _quoteIndex = 0;
let _dots = 0;

function showLoading(resultId, textId) {
  const labelMap = {
    'ol-result': 'Story Outline',
    'ch-result': 'Character Profile',
    'wb-result': 'World Lore',
    'pt-result': 'Plot Twist Ideas',
    'wp-result': 'Writing Prompt',
  };

  const box = document.getElementById(resultId);
  const textEl = document.getElementById(textId);
  box.style.display = 'block';

  const labelEl = box.querySelector('.result-label');
  if (labelEl) labelEl.textContent = labelMap[resultId] || '';

  const copyBtn = box.querySelector('.copy-btn');
  if (copyBtn) copyBtn.style.display = 'none';

  _quoteIndex = 0;
  _dots = 0;

  function render() {
    const quote = loadingQuotes[_quoteIndex % loadingQuotes.length];
    const dotStr = '.'.repeat((_dots % 3) + 1);
    textEl.innerHTML = `
      <div class="loading-wrap">
        <div class="loading-ink">
          <span class="ink-drop"></span>
          <span class="ink-drop"></span>
          <span class="ink-drop"></span>
        </div>
        <div class="loading-quote">${quote}<span class="loading-dots">${dotStr}</span></div>
        <div class="loading-bar-wrap"><div class="loading-bar-fill"></div></div>
      </div>
    `;
    _dots++;
    if (_dots % 4 === 0) _quoteIndex++;
  }

  render();
  clearInterval(loadingInterval);
  loadingInterval = setInterval(render, 700);
}

function stopLoading(resultId) {
  clearInterval(loadingInterval);
  const box = document.getElementById(resultId);
  const copyBtn = box?.querySelector('.copy-btn');
  if (copyBtn) copyBtn.style.display = '';
}

// ===== TYPEWRITER =====
function typewriterEffect(el, text, speed = 6) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// ===== DISPLAY RESULT =====
function displayResult(resultId, textId, text) {
  stopLoading(resultId);
  const el = document.getElementById(textId);
  typewriterEffect(el, text, 6);
}

// ===== PATCH GENERATE FUNCTIONS =====
// Ini override semua generate function biar pakai loading + typewriter

async function generateOutline() {
  const title = document.getElementById('ol-title').value;
  const genre = document.getElementById('ol-genre').value;
  const pov = document.getElementById('ol-pov').value;
  const protag = document.getElementById('ol-protag').value;
  const conflict = document.getElementById('ol-conflict').value;
  if (!title && !protag) { showToast('Isi dulu premis atau tokoh utama ya!'); return; }

  showLoading('ol-result', 'ol-result-text');
  const prompt = `Kamu adalah seorang penulis fiksi profesional berbahasa Indonesia. Buatkan story outline lengkap berdasarkan info berikut:

Premis/Judul: ${title || '(tidak ditentukan)'}
Genre: ${genre}
Sudut Pandang: ${pov}
Tokoh Utama & Tujuan: ${protag || '(tidak ditentukan)'}
Konflik Utama: ${conflict || '(tidak ditentukan)'}

Buat outline yang mencakup:
1. PREMIS — 2-3 kalimat inti cerita
2. BABAK 1 — Perkenalan, pemicu konflik
3. BABAK 2A — Eskalasi, komplikasi
4. MIDPOINT — Titik balik di tengah
5. BABAK 2B — Situasi memburuk, dark night of the soul
6. BABAK 3 — Klimaks dan resolusi

Gunakan bahasa Indonesia yang menarik. Berikan detail yang cukup untuk tiap bagian. Format dengan rapi.`;

  const result = await callClaude(prompt);
  displayResult('ol-result', 'ol-result-text', result);
}

async function generateCharacter() {
  const name = document.getElementById('ch-name').value;
  const age = document.getElementById('ch-age').value;
  const role = document.getElementById('ch-role').value;
  const traits = getSelectedTags('ch-traits');
  const bg = document.getElementById('ch-bg').value;
  const want = document.getElementById('ch-want').value;
  const fear = document.getElementById('ch-fear').value;
  if (!name) { showToast('Masukkan nama karakter dulu!'); return; }

  showLoading('ch-result', 'ch-result-text');
  const prompt = `Kamu adalah penulis fiksi profesional. Buatkan profil karakter yang mendalam dan hidup:

Nama: ${name}
Usia: ${age || 'tidak ditentukan'}
Peran: ${role}
Kepribadian: ${traits.join(', ') || 'tidak dipilih'}
Latar belakang: ${bg || 'tidak ada'}
Keinginan terdalam: ${want || 'tidak ditentukan'}
Ketakutan terbesar: ${fear || 'tidak ditentukan'}

Buatkan profil karakter lengkap dalam bahasa Indonesia meliputi:
• PENAMPILAN — gambaran fisik yang berkesan
• KEPRIBADIAN — cara berpikir, berbicara, bertindak
• LATAR BELAKANG — kisah yang membentuk mereka
• ARC KARAKTER — bagaimana mereka bisa berkembang
• HABIT & QUIRK — kebiasaan unik yang memorable
• DIALOG KHAS — 2-3 contoh cara mereka berbicara
• HUBUNGAN — bagaimana mereka berinteraksi dengan orang lain

Buat karakter ini terasa nyata dan berkedalaman.`;

  const result = await callClaude(prompt);
  displayResult('ch-result', 'ch-result-text', result);
}

async function generateWorld() {
  const name = document.getElementById('wb-name').value;
  const type = document.getElementById('wb-type').value;
  const aspects = getSelectedTags('wb-aspects');
  const rules = document.getElementById('wb-rules').value;

  showLoading('wb-result', 'wb-result-text');
  const prompt = `Kamu adalah worldbuilder fiksi profesional berbahasa Indonesia. Bangun dunia fiksi berikut:

Nama/Setting: ${name || 'dunia tanpa nama'}
Tipe: ${type}
Aspek yang dibangun: ${aspects.join(', ') || 'umum'}
Aturan unik: ${rules || 'tidak ada'}

Bangun dunia ini dengan detail kaya dan imajinatif dalam bahasa Indonesia. Untuk setiap aspek yang diminta, berikan:
- Penjelasan mendalam (bukan sekadar poin-poin)
- Detail unik yang memorable
- Bagaimana aspek ini mempengaruhi kehidupan sehari-hari penduduknya
- Potensi konflik yang muncul dari aspek ini

Jadikan dunia ini terasa hidup, konsisten, dan menarik untuk dijelajahi.`;

  const result = await callClaude(prompt);
  displayResult('wb-result', 'wb-result-text', result);
}

async function generateTwist() {
  const story = document.getElementById('pt-story').value;
  const intensity = getSelectedTags('pt-intensity')[0] || 'Sedang';
  const types = getSelectedTags('pt-type');
  if (!story) { showToast('Ceritakan dulu konteks ceritamu!'); return; }

  showLoading('pt-result', 'pt-result-text');
  const prompt = `Kamu adalah penulis fiksi dengan keahlian plot twist. Berikan ide plot twist yang mengejutkan.

Cerita saat ini: ${story}
Intensitas: ${intensity}
Tipe twist yang diinginkan: ${types.join(', ') || 'bebas'}

Berikan 3 ide plot twist yang berbeda dalam bahasa Indonesia. Untuk masing-masing:
1. TWIST — Penjelasan singkat twist-nya apa
2. SETUP — Bagaimana menanam petunjuk tanpa ketahuan
3. REVEAL — Cara terbaik mengungkapkan twist ini
4. DAMPAK — Bagaimana twist ini mengubah cerita dan karakter

Buat twist yang terasa mengejutkan tapi logis jika dilihat ke belakang (tidak asal-asalan).`;

  const result = await callClaude(prompt);
  displayResult('pt-result', 'pt-result-text', result);
}

async function generatePrompt(random = false) {
  const genre = random ? 'acak' : document.getElementById('wp-genre').value;
  const length = document.getElementById('wp-length').value;
  const elements = document.getElementById('wp-elements').value;
  const mood = getSelectedTags('wp-mood');

  showLoading('wp-result', 'wp-result-text');
  const prompt = `Kamu adalah generator writing prompt kreatif berbahasa Indonesia.

${random ? 'Buat writing prompt yang benar-benar acak dan unik!' : `Genre: ${genre}`}
Panjang target: ${length}
Elemen yang harus ada: ${elements || 'bebas'}
Mood: ${mood.join(', ') || 'bebas'}

Berikan 1 writing prompt yang:
- Memiliki pembuka yang langsung menarik (in medias res atau hook yang kuat)
- Cukup spesifik untuk memulai, tapi cukup terbuka untuk dikembangkan
- Mengandung konflik atau misteri yang menggoda
- Sesuai dengan mood dan genre yang diminta

Setelah prompt utama, berikan:
• KARAKTER — Saran karakter yang bisa digunakan
• PERTANYAAN KUNCI — 3 pertanyaan yang bisa mendorong cerita
• ARAH CERITA — 2 kemungkinan arah yang bisa diambil

Buat dalam bahasa Indonesia yang menggugah semangat menulis!`;

  const result = await callClaude(prompt);
  displayResult('wp-result', 'wp-result-text', result);
}

async function generateNames() {
  const setting = document.getElementById('ng-setting').value;
  const gender = document.getElementById('ng-gender').value;
  const vibe = getSelectedTags('ng-vibe');
  const count = document.getElementById('ng-count').value;

  document.getElementById('ng-result').style.display = 'block';
  document.getElementById('ng-names').innerHTML = `
    <div class="loading-wrap">
      <div class="loading-ink">
        <span class="ink-drop"></span>
        <span class="ink-drop"></span>
        <span class="ink-drop"></span>
      </div>
      <div class="loading-quote" style="color:var(--ink)">Menggali nama dari arsip dunia<span class="loading-dots" style="color:var(--amber)">...</span></div>
      <div class="loading-bar-wrap" style="background:rgba(0,0,0,0.1)"><div class="loading-bar-fill"></div></div>
    </div>
  `;

  const prompt = `Kamu adalah generator nama karakter fiksi. Generate ${count} nama karakter yang unik dan memorable.

Setting dunia: ${setting}
Jenis kelamin: ${gender}
Vibe nama: ${vibe.join(', ') || 'bebas'}

Berikan HANYA daftar nama saja, satu nama per baris, tanpa penjelasan, tanpa nomor, tanpa tanda baca tambahan. Nama harus terasa autentik sesuai setting dan vibe yang diminta.`;

  const result = await callClaude(prompt);
  const names = result.split('\n').map(n => n.trim()).filter(n => n.length > 0 && n.length < 40);
  document.getElementById('ng-names').innerHTML = names.map(n => `
    <div class="name-chip" onclick="navigator.clipboard.writeText('${n.replace(/'/g,"\\'")}');showToast('${n.replace(/'/g,"\\'")} disalin! ✦')">${n}</div>
  `).join('');
}

// ===== NAV =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav').addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });

  // Init tracker
  document.getElementById('tr-notes').value = localStorage.getItem('wc_notes') || '';
  renderChapters();
  renderSnippets();
  renderBooks();
  showPlaylist();

  let timerDone = parseInt(localStorage.getItem('wc_timer_done') || '0');
  document.getElementById('timer-done').textContent = timerDone;
});

// ===== TAG HELPERS =====
function toggleTag(el) { el.classList.toggle('selected'); }
function selectOne(el, groupId) {
  document.querySelectorAll(`#${groupId} .tag`).forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
}
function getSelectedTags(groupId) {
  return [...document.querySelectorAll(`#${groupId} .tag.selected`)].map(t => t.textContent);
}

// ===== COPY & TOAST =====
function copyResult(id) {
  const textEl = document.getElementById(id.replace('result','result-text'));
  if (!textEl) return;
  navigator.clipboard.writeText(textEl.innerText).catch(()=>{});
  showToast('Disalin! ✦');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ===== TRACKER =====
let chapters = JSON.parse(localStorage.getItem('wc_chapters') || '[]');

function updateProgress() {
  const target = parseInt(document.getElementById('tr-target').value) || 0;
  const current = parseInt(document.getElementById('tr-current').value) || 0;
  if (!target) { showToast('Masukkan target word count!'); return; }
  const pct = Math.min(100, Math.round(current / target * 100));
  const left = Math.max(0, target - current);
  document.getElementById('tr-progress-display').style.display = 'block';
  document.getElementById('tr-pct').textContent = pct + '%';
  document.getElementById('tr-bar').style.width = pct + '%';
  document.getElementById('tr-words-left').textContent =
    left > 0 ? `${left.toLocaleString()} kata lagi menuju target ✦` : '🎉 Target tercapai! Luar biasa!';
}

function addChapter() {
  const title = document.getElementById('ch-add-title').value.trim();
  const status = document.getElementById('ch-add-status').value;
  if (!title) { showToast('Tulis judul chapter dulu!'); return; }
  chapters.push({ title, status, id: Date.now() });
  localStorage.setItem('wc_chapters', JSON.stringify(chapters));
  document.getElementById('ch-add-title').value = '';
  renderChapters();
  showToast('Chapter ditambahkan! ✦');
}

function deleteChapter(id) {
  chapters = chapters.filter(c => c.id !== id);
  localStorage.setItem('wc_chapters', JSON.stringify(chapters));
  renderChapters();
}

function changeStatus(id, status) {
  const ch = chapters.find(c => c.id === id);
  if (ch) { ch.status = status; localStorage.setItem('wc_chapters', JSON.stringify(chapters)); renderChapters(); }
}

function renderChapters() {
  const list = document.getElementById('chapter-list');
  if (!list) return;
  if (chapters.length === 0) {
    list.innerHTML = '<p style="font-size:0.8rem;color:var(--mist);font-style:italic">Belum ada chapter. Tambahkan di bawah!</p>';
    return;
  }
  list.innerHTML = chapters.map((c, i) => `
    <div class="chapter-item">
      <span class="chapter-num">Ch.${i+1}</span>
      <span style="flex:1;font-size:0.88rem">${c.title}</span>
      <select onchange="changeStatus(${c.id},this.value)" style="width:auto;font-size:0.72rem;padding:0.2rem 0.4rem">
        <option value="draft" ${c.status==='draft'?'selected':''}>Draft</option>
        <option value="wip" ${c.status==='wip'?'selected':''}>WIP</option>
        <option value="done" ${c.status==='done'?'selected':''}>Done</option>
      </select>
      <span class="chapter-status status-${c.status}">${c.status.toUpperCase()}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteChapter(${c.id})">✕</button>
    </div>
  `).join('');
}

function saveNotes() {
  localStorage.setItem('wc_notes', document.getElementById('tr-notes').value);
}

// ===== SNIPPET SAVER =====
let snippets = JSON.parse(localStorage.getItem('wc_snippets') || '[]');

function addSnippet() {
  const label = document.getElementById('sn-label').value.trim() || 'Umum';
  const text = document.getElementById('sn-text').value.trim();
  if (!text) { showToast('Tulis dulu snippetnya!'); return; }
  snippets.unshift({ label, text, id: Date.now() });
  localStorage.setItem('wc_snippets', JSON.stringify(snippets));
  document.getElementById('sn-label').value = '';
  document.getElementById('sn-text').value = '';
  renderSnippets();
  showToast('Snippet disimpan! ✦');
}

function deleteSnippet(id) {
  snippets = snippets.filter(s => s.id !== id);
  localStorage.setItem('wc_snippets', JSON.stringify(snippets));
  renderSnippets();
}

function renderSnippets() {
  const list = document.getElementById('snippet-list');
  if (!list) return;
  if (snippets.length === 0) {
    list.innerHTML = '<p style="font-size:0.8rem;color:var(--mist);font-style:italic;padding:0.5rem 0">Belum ada snippet tersimpan.</p>';
    return;
  }
  list.innerHTML = snippets.map(s => `
    <div class="snippet-item">
      <div class="snippet-tag">${s.label}</div>
      <div class="snippet-text">${s.text}</div>
      <div class="snippet-actions">
        <button class="btn btn-sm btn-ghost" onclick="navigator.clipboard.writeText(\`${s.text.replace(/`/g,'\\`')}\`);showToast('Disalin! ✦')">Copy</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSnippet(${s.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

// ===== WRITING TIMER =====
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerCurrentLabel = 'Sesi Fokus';
let timerDoneSessions = parseInt(localStorage.getItem('wc_timer_done') || '0');

function setTimer(min, label) {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = min * 60;
  timerCurrentLabel = label;
  document.getElementById('timer-label').textContent = label;
  updateTimerDisplay();
  document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
  document.querySelector(`.timer-preset[data-min="${min}"]`)?.classList.add('active');
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2,'0');
  const s = (timerSeconds % 60).toString().padStart(2,'0');
  document.getElementById('timer-clock').textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('timer-label').textContent = timerCurrentLabel + ' — berjalan...';
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-label').textContent = '✦ Sesi selesai!';
      showToast('Sesi selesai! Istirahat dulu ✦');
      return;
    }
    timerSeconds--;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timer-label').textContent = timerCurrentLabel + ' — dijeda';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  setTimer(parseInt(document.querySelector('.timer-preset.active')?.dataset.min || '25'), timerCurrentLabel);
}

function addTimerSession() {
  timerDoneSessions++;
  localStorage.setItem('wc_timer_done', timerDoneSessions);
  document.getElementById('timer-done').textContent = timerDoneSessions;
  showToast(`Sesi ke-${timerDoneSessions} dicatat! 💪`);
}

// ===== MOOD PLAYLIST =====
const playlists = {
  'Epik & Dramatis': [
    { emoji:'⚔️', name:'Two Steps From Hell', desc:'Orchestral epic, cocok untuk battle scene', q:'Two Steps From Hell playlist' },
    { emoji:'🎻', name:'Hans Zimmer Scores', desc:'Sinematik dramatis, bikin nulis berasa epik', q:'Hans Zimmer epic film scores' },
    { emoji:'🔥', name:'Audiomachine', desc:'Orchestral intense untuk klimaks cerita', q:'Audiomachine epic music playlist' },
  ],
  'Melankolis & Sendu': [
    { emoji:'🌧️', name:'Sad Piano Music', desc:'Piano melankolis untuk adegan haru', q:'sad piano music playlist' },
    { emoji:'🍂', name:'Autumn Acoustic', desc:'Gitar akustik lembut, cocok untuk moment introspeksi', q:'autumn acoustic sad playlist' },
    { emoji:'🌙', name:'Yiruma Collection', desc:'Piano dreamy yang menyentuh hati', q:'Yiruma piano playlist' },
  ],
  'Menegangkan & Gelap': [
    { emoji:'🕯️', name:'Dark Ambient', desc:'Atmosfer kelam untuk scene horror/thriller', q:'dark ambient horror music playlist' },
    { emoji:'🖤', name:'Trent Reznor Scores', desc:'Industrial tense, perfect untuk psikologis thriller', q:'Trent Reznor atmospheric score' },
    { emoji:'⚡', name:'Suspense Orchestral', desc:'Build tension yang bikin pembaca tegang', q:'suspense orchestral thriller music' },
  ],
  'Hangat & Cozy': [
    { emoji:'☕', name:'Lofi Hip Hop', desc:'Beat santai untuk nulis tanpa distraksi', q:'lofi hip hop study playlist' },
    { emoji:'🏡', name:'Cozy Acoustic', desc:'Folk & indie hangat untuk cerita slice of life', q:'cozy acoustic folk playlist' },
    { emoji:'📚', name:'Jazz Café', desc:'Smooth jazz, cocok untuk nulis santai', q:'jazz cafe background music playlist' },
  ],
  'Romantis': [
    { emoji:'🌹', name:'Romantic Piano', desc:'Piano manis untuk adegan cinta', q:'romantic piano love music playlist' },
    { emoji:'💫', name:'Indie Romance', desc:'Indie folk dreamy untuk momen romantis', q:'indie romance playlist' },
    { emoji:'🎻', name:'Classical Romance', desc:'String quartet elegan untuk love story', q:'classical romantic string quartet' },
  ],
  'Petualangan': [
    { emoji:'🗺️', name:'Adventure Orchestral', desc:'Eksplorasi dan discovery, bikin semangat', q:'adventure orchestral exploration music' },
    { emoji:'🌊', name:'Celtic Adventure', desc:'Folk Celtic untuk dunia fantasy & petualangan', q:'celtic adventure folk music playlist' },
    { emoji:'⛵', name:'Indie Adventure', desc:'Upbeat indie untuk perjalanan seru', q:'indie adventure upbeat playlist' },
  ],
  'Fokus & Produktif': [
    { emoji:'🧠', name:'Brain.fm / Focus', desc:'Musik berbasis neurosains untuk deep focus', q:'focus deep work music playlist' },
    { emoji:'🎹', name:'Minimal Techno', desc:'Beat repetitif yang bikin masuk flow', q:'minimal techno focus work playlist' },
    { emoji:'🌿', name:'Nature + Ambient', desc:'Suara alam + ambient untuk konsentrasi', q:'nature ambient focus music' },
  ],
};

function showPlaylist() {
  const mood = getSelectedTags('pl-mood')[0] || 'Epik & Dramatis';
  const items = playlists[mood] || [];
  const el = document.getElementById('playlist-items');
  if (!el) return;
  el.innerHTML = items.map(p => `
    <div class="playlist-item">
      <span class="playlist-emoji">${p.emoji}</span>
      <div class="playlist-info">
        <div class="pl-name">${p.name}</div>
        <div class="pl-desc">${p.desc}</div>
      </div>
      <a class="playlist-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(p.q)}" target="_blank">Cari ↗</a>
    </div>
  `).join('');
}

// ===== READING LIST =====
let books = JSON.parse(localStorage.getItem('wc_books') || '[]');

function addBook() {
  const title = document.getElementById('rl-title').value.trim();
  const author = document.getElementById('rl-author').value.trim();
  const status = document.getElementById('rl-status').value;
  const note = document.getElementById('rl-note').value.trim();
  if (!title) { showToast('Masukkan judul buku dulu!'); return; }
  books.unshift({ title, author, status, note, id: Date.now() });
  localStorage.setItem('wc_books', JSON.stringify(books));
  document.getElementById('rl-title').value = '';
  document.getElementById('rl-author').value = '';
  document.getElementById('rl-note').value = '';
  renderBooks();
  showToast('Buku ditambahkan! ✦');
}

function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  localStorage.setItem('wc_books', JSON.stringify(books));
  renderBooks();
}

function renderBooks() {
  const list = document.getElementById('book-list');
  if (!list) return;
  if (books.length === 0) {
    list.innerHTML = '<p style="font-size:0.8rem;color:var(--mist);font-style:italic">Belum ada buku. Tambahkan di atas!</p>';
    return;
  }
  const statusLabel = { want:'Mau Baca', reading:'Sedang Baca', done:'Sudah Baca' };
  list.innerHTML = books.map((b, i) => `
    <div class="book-item">
      <span class="book-num">${i+1}.</span>
      <div class="book-info">
        <div class="book-title">${b.title}</div>
        ${b.author ? `<div class="book-author">oleh ${b.author}</div>` : ''}
        ${b.note ? `<div class="book-note">"${b.note}"</div>` : ''}
      </div>
      <span class="book-status-badge bstatus-${b.status}">${statusLabel[b.status]}</span>
      <button class="btn btn-sm btn-danger" style="margin-left:0.5rem" onclick="deleteBook(${b.id})">✕</button>
    </div>
  `).join('');
}
