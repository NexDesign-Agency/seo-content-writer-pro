import { useEffect, useMemo, useState } from "react";

const DEFAULT_HOMEPAGE_CONTENT = `Layanan pengepul minyak jelantah khusus Jakarta dengan:
Harga tinggi: Rp 6.500 - 8.000/liter
Express same day: booking pagi, jemput siang
Bayar langsung di tempat (cash / transfer)
No PHP (100% on time)
Harga:
20-200L -> Rp 6.500/L
201-500L -> Rp 7.000/L
500L+ -> Rp 8.000/L
Keunggulan Utama:
Express service: datang 30-60 menit (Jakarta)
Harga lebih tinggi: karena fokus area (cost lebih rendah)
Transparan: timbangan digital, tanpa potongan
Repeat order tinggi: 900+ customer
On time 100% (No PHP)
Area Layanan:
Seluruh DKI Jakarta (5 wilayah)
Tidak melayani luar Jakarta (Tangerang, Bekasi, dll)
Cara Kerja (3 Step):
Chat WhatsApp (info lokasi & volume)
Tim datang & timbang
Dibayar langsung di tempat
Total proses: 1-3 jam
Target Customer:
Restoran, warteg, catering, kafe
Rumah tangga & komunitas
Pengepul kecil / reseller
Positioning vs Kompetitor:
Lebih cepat (same day vs 1-2 hari)
Lebih tepat waktu
Minimal volume lebih kecil (20L)
Fokus Jakarta -> service lebih optimal
Insight Strategi:
Core angle: "Fokus Jakarta = lebih cepat + harga lebih tinggi"
Differentiator kuat: No PHP + same day
Trust builder: angka nyata (900+ customer, 1.5 juta liter)`;

const DEFAULT_INTERNAL_LINKS = `https://cctvgo.id/
https://cctvgo.id/harga-jasa-pasang-cctv-jakarta/
https://cctvgo.id/jasa-pasang-cctv-jakarta-pusat/
https://cctvgo.id/jasa-pasang-cctv-jakarta-barat/
https://cctvgo.id/jasa-pasang-cctv-jakarta-selatan/
https://cctvgo.id/jasa-pasang-cctv-jakarta-utara/
https://cctvgo.id/jasa-pasang-cctv-jakarta-timur/
https://cctvgo.id/area/
https://cctvgo.id/jasa-pasang-cctv/
https://cctvgo.id/panduan-lengkap-cctv/
https://cctvgo.id/rekomendasi-review-cctv/
https://cctvgo.id/tentang-kami/
https://cctvgo.id/kontak/
https://cctvgo.id/jasa-pasang-cctv-depok/
https://cctvgo.id/jasa-pasang-cctv-bogor/
https://cctvgo.id/jasa-pasang-cctv-bekasi/
https://cctvgo.id/jasa-pasang-cctv-tangerang/`;

const CONTENT_TYPES = ["PILAR", "BLOG", "SERVICE", "LOCAL SEO", "LANDING PAGE"];
const WORD_COUNT_OPTIONS = ["800-1200", "1200-1800", "1800-2500", "2500-3500"];
const TONE_OPTIONS = [
  "Profesional & Terpercaya",
  "Friendly Edukatif",
  "Formal Korporat",
  "Santai Persuasif",
  "Data-driven Expert",
];

const STORAGE_KEY = "seo-prompt-builder-state-v1";

type FormState = {
  h1Title: string;
  focusKeyword: string;
  contentType: string;
  targetUrl: string;
  wordCount: string;
  tone: string;
  brandName: string;
  niche: string;
  homepageContent: string;
  parentUrl: string;
  parentVisual: string;
  internalLinks: string;
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
  homepageContent: DEFAULT_HOMEPAGE_CONTENT,
  parentUrl: "https://cctvgo.id/area/",
  parentVisual: "Area Layanan",
  internalLinks: DEFAULT_INTERNAL_LINKS,
};

type PersistedState = {
  form: FormState;
  generatedPrompt: string;
};

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.form) {
      return null;
    }

    return {
      form: { ...initialForm, ...parsed.form },
      generatedPrompt: typeof parsed.generatedPrompt === "string" ? parsed.generatedPrompt : "",
    };
  } catch {
    return null;
  }
};

const resolveValue = (value: string, fallback = "(place holder)") => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const cleanLinks = (rawLinks: string) =>
  rawLinks
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

const detectHomepageUrl = (targetUrl: string) => {
  const trimmed = targetUrl.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsedUrl = new URL(normalized);
    return `${parsedUrl.protocol}//${parsedUrl.host}/`;
  } catch {
    return "";
  }
};

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "prompt-artikel";

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
  const parentUrl = resolveValue(form.parentUrl);
  const parentVisual = resolveValue(form.parentVisual);
  const homepageContent = resolveValue(form.homepageContent, "(place holder)");
  const internalLinks = cleanLinks(form.internalLinks) || "(place holder)";
  const homepageBase = resolvedHomepageUrl === "(place holder)" ? "(place holder)" : resolvedHomepageUrl.replace(/\/$/, "");
  const articleSlug = createSlug(h1Title);

  return `BUATKAN OUTPUT SESUAI RULES BERIKUT.

KONTEN HOMEPAGE UNTUK ANALISIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${homepageContent}
Gunakan semua informasi di atas sebagai konteks untuk artikel.
Nama Brand / Perusahaan: ${brandName}
Niche / Industri: ${niche}
Homepage URL: ${resolvedHomepageUrl}

STEP 2: SEO CONTENT BRIEF
═══════════════════════════════════════════════════════════════
BRIEF KONTEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Judul H1 : ${h1Title}
Fokus Keyword : ${focusKeyword}
Tipe Konten : ${contentType}
Brand : ${brandName}
Niche : ${niche}
Target URL : ${targetUrl}
Jumlah Kata : ${wordCount} (toleransi +/-100 kata)
Tone / Gaya : ${tone}
Bahasa : Bahasa Indonesia

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

CTA (sisipkan di 3 titik):
1) Setelah section ke-2 (soft CTA)
2) Tengah artikel (medium CTA)
3) Akhir artikel (strong CTA)
FAQ: minimal 5 FAQ dalam artikel

FORMAT OUTPUT (WAJIB IKUTI PERSIS!)
═══════════════════════════════════════════════════════════════
ATURAN OUTPUT MUTLAK:
- Output hanya berupa tabel dengan 9 kolom
- Tidak ada teks pembuka, penjelasan, atau penutup
- Langsung mulai dengan header tabel
- Kolom KONTEN wajib HTML (bukan Markdown)

STRUKTUR TABEL OUTPUT:
POST TITLE | Meta Description | URL Slug | Focus Keyword | breadcrumb_html | JUDUL ARTIKEL | KONTEN | IMAGE URL | ALT TEXT

PANDUAN KOLOM:
1) POST TITLE: maksimal 60 karakter, fokus keyword di awal
2) Meta Description: 150-160 karakter, keyword + CTA
3) URL Slug: lowercase, hyphen, tanpa domain, tanpa trailing slash
4) Focus Keyword: keyword utama
5) breadcrumb_html: gabungan visual breadcrumb + schema JSON-LD format @graph, satu baris tanpa line break
   WAJIB berisi 3 schema di dalam @graph: BreadcrumbList + Article + FAQPage.
   Gunakan struktur Article berikut di dalam @graph dan WAJIB tambahkan field name + url di author dan publisher:
   {
     "@context": "https://schema.org",
     "@type": "Article",
     "headline": "${h1Title}",
     "image": "${homepageBase}/wp-content/uploads/${articleSlug}.webp",
     "datePublished": "2025-01-15T08:00:00+07:00",
     "dateModified": "2025-01-15T08:00:00+07:00",
     "description": "[Meta Description]",
     "author": {
       "@type": "Organization",
       "@id": "${homepageBase}/#organization",
       "name": "${brandName}",
       "url": "${homepageBase}"
     },
     "publisher": {
       "@type": "Organization",
       "@id": "${homepageBase}/#organization",
       "name": "${brandName}",
       "url": "${homepageBase}"
     }
   }
   Gunakan struktur FAQPage berikut di dalam @graph (minimal 5 FAQ, sinkron dengan FAQ di konten):
   {
     "@context": "https://schema.org",
     "@type": "FAQPage",
     "mainEntity": [
       {
         "@type": "Question",
         "name": "[Pertanyaan 1]",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "[Jawaban 1]"
         }
       },
       {
         "@type": "Question",
         "name": "[Pertanyaan 2]",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "[Jawaban 2]"
         }
       },
       {
         "@type": "Question",
         "name": "[Pertanyaan 3]",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "[Jawaban 3]"
         }
       },
       {
         "@type": "Question",
         "name": "[Pertanyaan 4]",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "[Jawaban 4]"
         }
       },
       {
         "@type": "Question",
         "name": "[Pertanyaan 5]",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "[Jawaban 5]"
         }
       }
     ]
   }
6) JUDUL ARTIKEL: H1 halaman, tidak dimasukkan ke kolom KONTEN
7) KONTEN: wajib HTML, tanpa <h1>, mulai dari <p>, gunakan <h2>/<h3>/<h4>, <ul><li>, <table>, <blockquote>, dan link <a href="URL">anchor</a>
8) IMAGE URL: path relatif /[slug].webp
9) ALT TEXT: deskriptif dengan keyword, variasi dari H1

LARANGAN:
- Jangan ada teks sebelum/sesudah tabel
- Jangan gunakan Markdown di kolom KONTEN
- Jangan masukkan <h1> di kolom KONTEN
- Jangan masukkan schema di kolom KONTEN

PLACEHOLDER INPUT:
Judul H1: ${h1Title}
Fokus Keyword: ${focusKeyword}
Tipe Konten: ${contentType}
Target URL: ${targetUrl}
Jumlah Kata: ${wordCount}
Homepage URL: ${resolvedHomepageUrl}
Gaya tone tulisan: ${tone}
Nama Brand: ${brandName}
Niche / Industri: ${niche}
Konten Homepage: ${homepageContent}

BREADCRUMB:
BERANDA > ${parentVisual} > ${h1Title}
URL PARENT 1 = ${parentUrl}
PARENT 1 VISUAL = ${parentVisual}
JUDUL H1 (otomatis dari h1) = ${h1Title}
Contoh output: Home > ${parentVisual} > ${h1Title}`;
};

export default function App() {
  const [form, setForm] = useState<FormState>(() => loadPersistedState()?.form ?? initialForm);
  const [generatedPrompt, setGeneratedPrompt] = useState(() => loadPersistedState()?.generatedPrompt ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const payload: PersistedState = { form, generatedPrompt };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [form, generatedPrompt]);

  const homepageUrl = useMemo(() => detectHomepageUrl(form.targetUrl), [form.targetUrl]);

  const breadcrumbPreview = useMemo(() => {
    const parent = form.parentVisual.trim() || "(Parent 1 Visual)";
    const title = form.h1Title.trim() || "(Judul H1)";
    return `Beranda > ${parent} > ${title}`;
  }, [form.parentVisual, form.h1Title]);

  const requiredFieldsFilled = useMemo(() => {
    return Boolean(
      form.h1Title.trim() &&
        form.focusKeyword.trim() &&
        form.contentType.trim() &&
        form.targetUrl.trim() &&
        form.wordCount.trim() &&
        form.tone.trim() &&
        form.brandName.trim() &&
        form.niche.trim() &&
        form.homepageContent.trim() &&
        form.parentUrl.trim() &&
        form.parentVisual.trim() &&
        cleanLinks(form.internalLinks)
    );
  }, [form]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setGeneratedPrompt("");
    setCopied(false);
  };

  const resetToPlaceholder = () => {
    setForm(initialForm);
    setGeneratedPrompt("");
    setCopied(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const handleGenerate = () => {
    if (!requiredFieldsFilled) {
      return;
    }
    const prompt = buildPrompt(form, homepageUrl);
    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  const copyPrompt = async () => {
    if (!generatedPrompt) {
      return;
    }
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
  };

  const downloadPrompt = () => {
    if (!generatedPrompt) {
      return;
    }

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
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.h1Title}
                  onChange={(event) => updateField("h1Title", event.target.value)}
                  placeholder="(place holder)"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Fokus Keyword</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.focusKeyword}
                  onChange={(event) => updateField("focusKeyword", event.target.value)}
                  placeholder="(place holder)"
                />
              </label>
            </div>

            <div className="space-y-2 text-sm">
              <p>Tipe Konten</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField("contentType", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      form.contentType === option
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>Jumlah Kata (klik pilih)</p>
              <div className="flex flex-wrap gap-2">
                {WORD_COUNT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField("wordCount", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      form.wordCount === option
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>Gaya Tone Tulisan (klik pilih)</p>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField("tone", option)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      form.tone === option
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Target URL</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.targetUrl}
                  onChange={(event) => updateField("targetUrl", event.target.value)}
                  placeholder="(place holder)"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Homepage URL (auto detect dari Target URL)</span>
                <input
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-300"
                  value={homepageUrl || "(otomatis muncul setelah Target URL valid)"}
                  readOnly
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Nama Brand</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.brandName}
                  onChange={(event) => updateField("brandName", event.target.value)}
                  placeholder="(place holder)"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Niche / Industri</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.niche}
                  onChange={(event) => updateField("niche", event.target.value)}
                  placeholder="(place holder)"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>URL Parent 1</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.parentUrl}
                  onChange={(event) => updateField("parentUrl", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Parent 1 Visual</span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-cyan-400"
                  value={form.parentVisual}
                  onChange={(event) => updateField("parentVisual", event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
              <p className="text-zinc-400">Preview Breadcrumb</p>
              <p className="mt-1 text-zinc-100">{breadcrumbPreview}</p>
            </div>

            <label className="block space-y-2 text-sm">
              <span>Konten Homepage untuk Analisis</span>
              <textarea
                className="min-h-56 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                value={form.homepageContent}
                onChange={(event) => updateField("homepageContent", event.target.value)}
                placeholder="(place holder)"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span>Daftar Internal Link (1 URL per baris)</span>
              <textarea
                className="min-h-44 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                value={form.internalLinks}
                onChange={(event) => updateField("internalLinks", event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {requiredFieldsFilled ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-cyan-400"
                >
                  Generate Artikel
                </button>
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  Lengkapi semua field wajib untuk menampilkan tombol Generate Artikel.
                </div>
              )}

              <button
                type="button"
                onClick={resetToPlaceholder}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
              >
                Reset
              </button>
            </div>
          </form>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Output Prompt</h2>
            <textarea
              readOnly
              value={generatedPrompt || "Klik Generate Artikel setelah semua field lengkap."}
              className="min-h-[900px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm leading-relaxed text-zinc-100"
            />

            {generatedPrompt && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
                >
                  {copied ? "Prompt berhasil disalin" : "Copy Prompt"}
                </button>
                <button
                  type="button"
                  onClick={downloadPrompt}
                  className="rounded-md border border-zinc-500 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-300"
                >
                  Download .txt
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
