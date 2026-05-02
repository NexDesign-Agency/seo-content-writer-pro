import { useEffect, useMemo, useState } from "react";

const DEFAULT_HOMEPAGE_CONTENT = "";
const DEFAULT_INTERNAL_LINKS = "";

const CONTENT_TYPES = ["PILAR", "BLOG", "SERVICE", "LOCAL SEO", "LANDING PAGE"];
const WORD_COUNT_OPTIONS = ["800-1200", "1200-1800", "1800-2500", "2500-3500"];
const TONE_OPTIONS = [
  "Profesional & Terpercaya",
  "Friendly Edukatif",
  "Formal Korporat",
  "Santai Persuasif",
  "Data-driven Expert",
  "Conversational Yet Authoritative",
];

const STORAGE_KEY = "seo-prompt-builder-state-v1";
const PRESETS_KEY = "seo-prompt-builder-presets-v1";

type FormState = {
  h1Title: string;
  focusKeyword: string;
  contentType: string;
  targetUrl: string;
  wordCount: string;
  tone: string;
  brandName: string;
  niche: string;
  ctaTarget: string;
  homepageContent: string;
  parentUrl: string;
  parentVisual: string;
  internalLinks: string;
  breadcrumbOverride: string;
};

const initialForm: FormState = {
  h1Title: "",
  focusKeyword: "",
  contentType: "PILAR",
  targetUrl: "",
  wordCount: "",
  tone: "Profesional & Terpercaya",
  brandName: "",
  niche: "",
  ctaTarget: "",
  homepageContent: DEFAULT_HOMEPAGE_CONTENT,
  parentUrl: "",
  parentVisual: "",
  internalLinks: DEFAULT_INTERNAL_LINKS,
  breadcrumbOverride: "",
};

type PersistedState = {
  form: FormState;
  generatedPrompt: string;
};

type PresetItem = {
  id: string;
  name: string;
  form: FormState;
  updatedAt: string;
};

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.form) return null;
    return {
      form: { ...initialForm, ...parsed.form },
      generatedPrompt: typeof parsed.generatedPrompt === "string" ? parsed.generatedPrompt : "",
    };
  } catch {
    return null;
  }
};

const loadPresets = (): PresetItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresetItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((preset) => preset && typeof preset.name === "string" && preset.form)
      .map((preset) => ({
        ...preset,
        id: typeof preset.id === "string" ? preset.id : `preset-${Date.now()}`,
        name: preset.name.trim(),
        form: { ...initialForm, ...preset.form },
        updatedAt: typeof preset.updatedAt === "string" ? preset.updatedAt : new Date().toISOString(),
      }))
      .filter((preset) => preset.name.length > 0);
  } catch {
    return [];
  }
};

const resolveValue = (value: string, fallback = "(place holder)") => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const cleanLinks = (rawLinks: string) =>
  rawLinks.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");

const detectHomepageUrl = (targetUrl: string) => {
  const trimmed = targetUrl.trim();
  if (!trimmed) return "";
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsedUrl = new URL(normalized);
    return `${parsedUrl.protocol}//${parsedUrl.host}/`;
  } catch {
    return "";
  }
};

const createSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "prompt-artikel";

const CONVERSATIONAL_TONE_RULES = `
ATURAN TONE & RITME KHUSUS — CONVERSATIONAL YET AUTHORITATIVE:
═══════════════════════════════════════════════════════════════
Tone: Bicara seperti teman yang pintar dan berpengalaman.
Bukan menggurui. Bukan korporat. Tapi tetap dipercaya.

Ritme (WAJIB diterapkan di setiap paragraf):
- Campur kalimat panjang dan pendek secara sadar.
- Gunakan kalimat satu baris untuk penekanan poin penting.
- Setelah 2-3 kalimat panjang, selipkan 1 kalimat pendek yang menghantam.
- Biarkan ada "jeda napas" — paragraf pendek 1-2 kalimat setelah blok panjang.

Contoh ritme SALAH (monoton):
"Penampung tangan pertama membayar lebih tinggi karena mereka langsung terhubung dengan pabrik biodiesel tanpa perantara. Hal ini menyebabkan margin yang lebih baik untuk penjual."

Contoh ritme BENAR (bernyawa):
"Penampung tangan pertama langsung terhubung ke pabrik biodiesel. Tidak ada perantara. Tidak ada potongan di tengah.
Hasilnya? Harga yang kamu terima jauh lebih tinggi."

Aturan tambahan:
- Gunakan "kamu" bukan "Anda" untuk kesan akrab
- Boleh mulai kalimat dengan "Dan", "Tapi", "Karena" untuk efek ritme
- Angka dan fakta harus diikuti dampaknya langsung (jangan biarkan data mengambang)
- Hindari kata-kata: "merupakan", "tersebut", "dalam rangka", "sehubungan dengan"
- Hindari pembuka generik: "Dalam era modern ini...", "Tidak dapat dipungkiri..."
- Setiap section harus punya 1 kalimat yang "menghantam" — pendek, tajam, berkesan
`;

const getISODate = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  return `${yyyy}-${mm}-${dd}T08:00:00+07:00`;
};

const buildPrompt = (form: FormState, homepageUrl: string) => {
  const h1Title = resolveValue(form.h1Title);
  const focusKeyword = resolveValue(form.focusKeyword);
  const contentType = resolveValue(form.contentType);
  const targetUrl = resolveValue(form.targetUrl);
  const wordCount = resolveValue(form.wordCount);
  const resolvedHomepageUrl = resolveValue(homepageUrl);
  const tone = resolveValue(form.tone);
  const brandName = resolveValue(form.brandName);
  const niche = resolveValue(form.niche);
  const parentUrl = form.parentUrl.trim();
  const parentVisual = form.parentVisual.trim();
  const hasParent = parentVisual.length > 0 && parentVisual !== ">" && parentUrl.length > 0;
  const homepageContent = resolveValue(form.homepageContent, "(place holder)");
  const internalLinks = cleanLinks(form.internalLinks) || "(place holder)";
  const homepageBase = resolvedHomepageUrl === "(place holder)" ? "(place holder)" : resolvedHomepageUrl.replace(/\/$/, "");
  const articleSlug = createSlug(h1Title);
  const breadcrumbText = form.breadcrumbOverride.trim() || (hasParent ? `BERANDA > ${parentVisual} > ${h1Title}` : `BERANDA > ${h1Title}`);
  const conversationalRules = tone === "Conversational Yet Authoritative" ? CONVERSATIONAL_TONE_RULES : "";
  const ctaTarget = resolveValue(form.ctaTarget);
  const isoDate = getISODate();

  return `PENTING: Langsung output tabel tanpa teks pembuka, penjelasan, atau penutup apapun. Mulai langsung dari header tabel.

BUATKAN OUTPUT SESUAI RULES BERIKUT.

STEP 1 — KONTEKS BISNIS & HOMEPAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${homepageContent}
Nama Brand / Perusahaan: ${brandName}
Niche / Industri: ${niche}
Homepage URL: ${resolvedHomepageUrl}
CTA Target (nomor WA / URL tujuan): ${ctaTarget}

STEP 2 — SEO CONTENT BRIEF:
═══════════════════════════════════════════════════════════════
BRIEF KONTEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Judul H1 : ${h1Title}
Fokus Keyword : ${focusKeyword}
Tipe Konten : ${contentType}
Brand : ${brandName}
Niche : ${niche}
Target URL : ${targetUrl}
Jumlah Kata : ${wordCount} kata (WAJIB. Hitung sebelum output. Jika kurang dari batas bawah, tambahkan section baru sampai tercapai. Jangan kirim output jika word count belum terpenuhi.)
Tone / Gaya : ${tone}
Bahasa : Bahasa Indonesia
${conversationalRules}
SEO ON-PAGE RULES (WAJIB DIIKUTI!)
═══════════════════════════════════════════════════════════════
TITLE TAG: 50-60 karakter, fokus keyword di awal
META DESCRIPTION: 150-160 karakter, keyword + CTA
H1 TAG: hanya 1 H1 (di kolom terpisah, bukan di dalam konten)
HEADING HIERARCHY: H2 -> H3 -> H4 terstruktur
KEYWORD DENSITY: 1-2% dari total kata
KEYWORD PLACEMENT:
- 100 kata pertama
- Minimal 2-3 H2
- Paragraf terakhir
PARAGRAPH: maksimal 3-4 kalimat (mobile-friendly)
FORMAT: bullet points, bold, tabel, blockquote
E-E-A-T: data statistik, pengalaman brand, social proof

INTERNAL LINKING (sisipkan natural):
${internalLinks}
ATURAN INTERNAL LINK (WAJIB):
- Gunakan hanya URL dari daftar internal link yang diberikan.
- Jumlah internal link di kolom KONTEN wajib 5-10 link total.
- Dilarang menghasilkan lebih dari 10 internal link.
- Jika internal link kurang dari 5 atau lebih dari 10, revisi dulu output sebelum dikirim.

CTA (sisipkan di 3 titik):
1) Setelah section ke-2 (soft CTA)
2) Tengah artikel (medium CTA)
3) Akhir artikel (strong CTA)
FAQ: minimal 5 FAQ dalam artikel
Jumlah internal link yang dihasilkan: minimal 5 dan maksimal 10 link internal

FORMAT OUTPUT (WAJIB IKUTI PERSIS!)
═══════════════════════════════════════════════════════════════
ATURAN OUTPUT MUTLAK:
- Output hanya berupa tabel dengan 9 kolom
- Tidak ada teks pembuka, penjelasan, atau penutup
- Langsung mulai dengan header tabel
- Kolom KONTEN wajib HTML (bukan Markdown)
- Word count kolom KONTEN WAJIB sesuai brief. Hitung ulang jika ragu. Tambah section baru jika masih kurang.

STRUKTUR TABEL OUTPUT:
POST TITLE | Meta Description | URL Slug | Focus Keyword | breadcrumb_html | JUDUL ARTIKEL | KONTEN | IMAGE URL | ALT TEXT

PANDUAN KOLOM:
1) POST TITLE: maksimal 60 karakter, fokus keyword di awal
2) Meta Description: 150-160 karakter, keyword + CTA
3) URL Slug: lowercase, hyphen, tanpa domain, tanpa trailing slash
4) Focus Keyword: keyword utama
5) breadcrumb_html: GABUNGAN 3 bagian berikut, semua dijadikan SATU BARIS (minify, tanpa line break, tanpa spasi berlebih):

   BAGIAN A — CSS (minify jadi satu baris):
   <style>.breadcrumb-nav{background:#f8f9fa;padding:8px 12px;border-radius:6px;margin:12px 0;border-left:3px solid #27ae60}.breadcrumb{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:.85em}.breadcrumb li{display:inline}.breadcrumb a{color:#3498db;text-decoration:none;transition:color .3s}.breadcrumb a:hover{color:#27ae60;text-decoration:underline}.breadcrumb-separator{color:#999;font-weight:700;user-select:none}.breadcrumb .active{color:#2c3e50;font-weight:600}@media(max-width:768px){.breadcrumb{font-size:.78em}.breadcrumb-nav{padding:6px 10px;margin:8px 0}}</style>

   BAGIAN B — HTML Nav (minify jadi satu baris):
   <nav class="breadcrumb-nav" aria-label="breadcrumb"><ol class="breadcrumb"><li><a href="${homepageBase}/">🏠 Beranda</a></li>${hasParent ? `<li class="breadcrumb-separator" aria-hidden="true">›</li><li><a href="${parentUrl}">${parentVisual}</a></li>` : ""}<li class="breadcrumb-separator" aria-hidden="true">›</li><li class="active" aria-current="page">${h1Title}</li></ol></nav>

   BAGIAN C — JSON-LD satu <script>, satu @context di root, @graph berisi 3 schema (minify jadi satu baris):
   {
     "@context": "https://schema.org",
     "@graph": [
       {
         "@type": "BreadcrumbList",
         "itemListElement": [
           { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "${homepageBase}/" }${hasParent ? `,
           { "@type": "ListItem", "position": 2, "name": "${parentVisual}", "item": "${parentUrl}" },
           { "@type": "ListItem", "position": 3, "name": "${h1Title}", "item": "${targetUrl}" }` : `,
           { "@type": "ListItem", "position": 2, "name": "${h1Title}", "item": "${targetUrl}" }`}
         ]
       },
       {
         "@type": "Article",
         "headline": "${h1Title}",
         "image": "${homepageBase}/wp-content/uploads/${articleSlug}.webp",
         "datePublished": "${isoDate}",
         "dateModified": "${isoDate}",
         "description": "[isi Meta Description yang dihasilkan]",
         "author": { "@type": "Organization", "@id": "${homepageBase}/#organization", "name": "${brandName}", "url": "${homepageBase}" },
         "publisher": { "@type": "Organization", "@id": "${homepageBase}/#organization", "name": "${brandName}", "url": "${homepageBase}" }
       },
       {
         "@type": "FAQPage",
         "mainEntity": [
           { "@type": "Question", "name": "[Pertanyaan 1]", "acceptedAnswer": { "@type": "Answer", "text": "[Jawaban 1]" } },
           { "@type": "Question", "name": "[Pertanyaan 2]", "acceptedAnswer": { "@type": "Answer", "text": "[Jawaban 2]" } },
           { "@type": "Question", "name": "[Pertanyaan 3]", "acceptedAnswer": { "@type": "Answer", "text": "[Jawaban 3]" } },
           { "@type": "Question", "name": "[Pertanyaan 4]", "acceptedAnswer": { "@type": "Answer", "text": "[Jawaban 4]" } },
           { "@type": "Question", "name": "[Pertanyaan 5]", "acceptedAnswer": { "@type": "Answer", "text": "[Jawaban 5]" } }
         ]
       }
     ]
   }

   PENTING — WAJIB DIIKUTI:
   - Kolom breadcrumb_html TIDAK BOLEH KOSONG. Ini kolom kritikal untuk import WordPress.
   - Output harus berupa SATU BARIS tunggal — gabungkan Bagian A + B + C tanpa newline, tanpa line break, tanpa spasi ganda.
   - Minify semua bagian menjadi satu string panjang yang bisa ditempel langsung ke satu cell spreadsheet.
   - FAQPage di dalam @graph wajib sinkron dengan FAQ yang ada di kolom KONTEN.
   - Jika konten terlalu panjang, tetap wajib diisi — jangan kosongkan dengan alasan apapun.
6) JUDUL ARTIKEL: H1 halaman, tidak dimasukkan ke kolom KONTEN
7) KONTEN: wajib HTML, tanpa <h1>, mulai dari <p>, gunakan <h2>/<h3>/<h4>, <ul><li>, <table>, <blockquote>, dan link <a href="URL">anchor</a>
8) IMAGE URL: path relatif /[slug].webp
9) ALT TEXT: deskriptif dengan keyword, variasi dari H1

LARANGAN:
- Jangan ada teks sebelum/sesudah tabel
- Jangan gunakan Markdown di kolom KONTEN
- Jangan masukkan <h1> di kolom KONTEN
- Jangan masukkan schema di kolom KONTEN
- Jangan pakai internal link lebih dari 10 tautan di kolom KONTEN

BREADCRUMB:
${breadcrumbText}
${hasParent ? `URL PARENT 1 = ${parentUrl}
PARENT 1 VISUAL = ${parentVisual}
` : ""}JUDUL H1 = ${h1Title}
Contoh output: ${breadcrumbText}`;
};

export default function App() {
  const [form, setForm] = useState<FormState>(() => loadPersistedState()?.form ?? initialForm);
  const [generatedPrompt, setGeneratedPrompt] = useState(() => loadPersistedState()?.generatedPrompt ?? "");
  const [copied, setCopied] = useState(false);
  const [presets, setPresets] = useState<PresetItem[]>(() => loadPresets());
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetNotice, setPresetNotice] = useState("");

  useEffect(() => {
    const payload: PersistedState = { form, generatedPrompt };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [form, generatedPrompt]);

  useEffect(() => {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  const homepageUrl = useMemo(() => detectHomepageUrl(form.targetUrl), [form.targetUrl]);

  const breadcrumbPreview = useMemo(() => {
    const parent = form.parentVisual.trim();
    const title = form.h1Title.trim() || "(Judul H1)";
    const isValidParent = parent.length > 0 && parent !== ">";
    return isValidParent ? `Beranda > ${parent} > ${title}` : `Beranda > ${title}`;
  }, [form.parentVisual, form.h1Title]);

  const requiredFieldsFilled = useMemo(() => {
    return Boolean(
      form.h1Title.trim() && form.focusKeyword.trim() && form.contentType.trim() &&
      form.targetUrl.trim() && form.wordCount.trim() && form.tone.trim() &&
      form.brandName.trim() && form.niche.trim() && form.ctaTarget.trim() &&
      form.homepageContent.trim() &&
      cleanLinks(form.internalLinks)
    );
  }, [form]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setGeneratedPrompt("");
    setCopied(false);
  };

  const showNotice = (msg: string) => {
    setPresetNotice(msg);
    setTimeout(() => setPresetNotice(""), 3000);
  };

  const savePreset = () => {
    const normalizedName = presetName.trim();
    if (!normalizedName) { showNotice("Isi nama preset dulu."); return; }
    const now = new Date().toISOString();
    setPresets((prev) => {
      const existing = prev.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase());
      if (existing) {
        setSelectedPresetId(existing.id);
        showNotice(`Preset "${normalizedName}" berhasil di-update.`);
        return prev.map((item) => item.id === existing.id ? { ...item, name: normalizedName, form: { ...form }, updatedAt: now } : item);
      }
      const newPreset: PresetItem = { id: `preset-${Date.now()}`, name: normalizedName, form: { ...form }, updatedAt: now };
      setSelectedPresetId(newPreset.id);
      showNotice(`Preset "${normalizedName}" berhasil disimpan.`);
      return [newPreset, ...prev];
    });
  };

  const loadPresetById = () => {
    if (!selectedPresetId) { showNotice("Pilih preset yang ingin di-load."); return; }
    const selected = presets.find((item) => item.id === selectedPresetId);
    if (!selected) { showNotice("Preset tidak ditemukan."); return; }
    setForm({ ...initialForm, ...selected.form });
    setGeneratedPrompt("");
    setCopied(false);
    setPresetName(selected.name);
    showNotice(`Preset "${selected.name}" berhasil di-load.`);
  };

  const deletePresetById = () => {
    if (!selectedPresetId) { showNotice("Pilih preset yang ingin dihapus."); return; }
    const selected = presets.find((item) => item.id === selectedPresetId);
    if (!selected) { showNotice("Preset tidak ditemukan."); return; }
    if (!window.confirm(`Hapus preset "${selected.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setPresets((prev) => prev.filter((item) => item.id !== selectedPresetId));
    setSelectedPresetId("");
    if (presetName.trim().toLowerCase() === selected.name.toLowerCase()) setPresetName("");
    showNotice(`Preset "${selected.name}" berhasil dihapus.`);
  };

  const resetToPlaceholder = () => {
    if (!window.confirm("Reset semua field ke kondisi awal? Data yang belum disimpan sebagai preset akan hilang.")) return;
    setForm(initialForm);
    setGeneratedPrompt("");
    setCopied(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const handleGenerate = () => {
    if (!requiredFieldsFilled) return;
    setGeneratedPrompt(buildPrompt(form, homepageUrl));
    setCopied(false);
  };

  const copyPrompt = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
  };

  const downloadPrompt = () => {
    if (!generatedPrompt) return;
    const fileName = `${createSlug(form.h1Title || form.focusKeyword)}.txt`;
    const blob = new Blob([generatedPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <p className="text-sm tracking-wide text-zinc-400">Prompt Builder SEO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Generator Prompt Artikel SEO</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Lengkapi field, klik generate, lalu copy atau download hasil prompt.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Judul H1</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.h1Title} onChange={(e) => updateField("h1Title", e.target.value)} placeholder="Contoh: Jasa Pasang CCTV Jakarta" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Fokus Keyword</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.focusKeyword} onChange={(e) => updateField("focusKeyword", e.target.value)} placeholder="Contoh: pasang cctv jakarta" />
              </label>
            </div>

            <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
              <p className="text-sm font-medium text-zinc-100">Preset Website</p>
              <p className="text-xs text-zinc-400">Simpan konfigurasi per website, lalu load kapan saja saat pindah project.</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Contoh: Website A - CCTVGO" />
                <button type="button" onClick={savePreset} className="rounded-md bg-violet-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-violet-400">Save Preset</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <select className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400" value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}>
                  <option value="">Pilih preset tersimpan</option>
                  {presets.map((preset) => (<option key={preset.id} value={preset.id}>{preset.name}</option>))}
                </select>
                <button type="button" onClick={loadPresetById} className="rounded-md border border-emerald-500/60 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400">Load Preset</button>
                <button type="button" onClick={deletePresetById} className="rounded-md border border-rose-500/60 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400">Hapus</button>
              </div>
              {presetNotice && <p className="text-xs text-zinc-300">{presetNotice}</p>}
            </div>

            <div className="space-y-2 text-sm">
              <p>Tipe Konten</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((option) => (
                  <button key={option} type="button" onClick={() => updateField("contentType", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${form.contentType === option ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>Jumlah Kata (klik pilih)</p>
              <div className="flex flex-wrap gap-2">
                {WORD_COUNT_OPTIONS.map((option) => (
                  <button key={option} type="button" onClick={() => updateField("wordCount", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${form.wordCount === option ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>Gaya Tone Tulisan (klik pilih)</p>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((option) => (
                  <button key={option} type="button" onClick={() => updateField("tone", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      form.tone === option
                        ? option === "Conversational Yet Authoritative"
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                    }`}>
                    {option}
                    {option === "Conversational Yet Authoritative" && " ✨"}
                  </button>
                ))}
              </div>
              {form.tone === "Conversational Yet Authoritative" && (
                <p className="mt-1 text-xs text-amber-300/80">
                  ✨ Mode ini menyisipkan aturan ritme khusus ke dalam prompt — kalimat pendek-panjang bergantian, tone akrab tapi dipercaya.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Target URL</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.targetUrl} onChange={(e) => updateField("targetUrl", e.target.value)} placeholder="https://cctvgo.id/jasa-pasang-cctv-jakarta/" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Homepage URL (auto detect dari Target URL)</span>
                <input className="w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-300" value={homepageUrl || "(otomatis muncul setelah Target URL valid)"} readOnly />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Nama Brand</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.brandName} onChange={(e) => updateField("brandName", e.target.value)} placeholder="Nama Bisnis / Brand" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Niche / Industri</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.niche} onChange={(e) => updateField("niche", e.target.value)} placeholder="Contoh: Keamanan, CCTV, IT" />
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span>CTA Target <span className="text-zinc-400">(nomor WhatsApp atau URL tujuan CTA)</span></span>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.ctaTarget} onChange={(e) => updateField("ctaTarget", e.target.value)} placeholder="Contoh: https://wa.me/6281234567890 atau https://domain.com/kontak/" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>URL Parent 1</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.parentUrl} onChange={(e) => updateField("parentUrl", e.target.value)} placeholder="https://client-web.com/category/" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Parent 1 Visual</span>
                <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400" value={form.parentVisual} onChange={(e) => updateField("parentVisual", e.target.value)} placeholder="Contoh: Area Layanan" />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm">Preview Breadcrumb (Bisa diedit manual)</p>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-cyan-200 outline-none transition focus:border-cyan-400" value={form.breadcrumbOverride || breadcrumbPreview} onChange={(e) => updateField("breadcrumbOverride", e.target.value)} placeholder={breadcrumbPreview} />
            </div>

            <label className="block space-y-2 text-sm">
              <span>Konten Homepage untuk Analisis</span>
              <textarea className="min-h-56 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400" value={form.homepageContent} onChange={(e) => updateField("homepageContent", e.target.value)} placeholder="Paste konten halaman utama atau konteks bisnis di sini..." />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Daftar Internal Link (1 URL per baris)</span>
              <textarea className="min-h-44 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400" value={form.internalLinks} onChange={(e) => updateField("internalLinks", e.target.value)} />
            </label>

            <div className="flex flex-wrap gap-3">
              {requiredFieldsFilled ? (
                <button type="button" onClick={handleGenerate} className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-cyan-400">Generate Artikel</button>
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  Lengkapi semua field wajib untuk menampilkan tombol Generate Artikel.
                </div>
              )}
              <button type="button" onClick={resetToPlaceholder} className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400">Reset Form</button>
            </div>
          </form>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Output Prompt</h2>
            <textarea readOnly value={generatedPrompt || "Klik Generate Artikel setelah semua field lengkap."} className="min-h-[900px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm leading-relaxed text-zinc-100" />
            {generatedPrompt && (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={copyPrompt} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400">
                  {copied ? "Prompt berhasil disalin" : "Copy Prompt"}
                </button>
                <button type="button" onClick={downloadPrompt} className="rounded-md border border-zinc-500 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-300">Download .txt</button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
