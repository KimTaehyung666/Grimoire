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
