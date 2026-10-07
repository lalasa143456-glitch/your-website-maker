import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles, Zap, ShieldCheck, LayoutDashboard, Package, Boxes, ShoppingCart,
  Wallet, FileBarChart, MessageCircle, Instagram, MapPin, ImageIcon, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UMKM Manager — Bantu UMKM Kuliner Bekasi Lebih Rapi" },
      { name: "description", content: "Kelola produk, stok, penjualan, keuangan, dan laporan usaha kuliner kamu dengan cara yang sederhana, praktis, dan terpercaya." },
      { property: "og:title", content: "UMKM Manager — Bantu UMKM Kuliner Lebih Rapi" },
      { property: "og:description", content: "Platform digital sederhana untuk UMKM kuliner mikro dan kecil di Bekasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NA = "Informasi belum tersedia.";

const products = [
  { name: "Brownies Cokelat", desc: "Tekstur lembut dan rasa cokelat yang nikmat.", price: "Rp25.000" },
  { name: "Cookies Cokelat", desc: "Renyah, manis, dan cocok dinikmati sendiri atau bareng teman.", price: "Rp15.000" },
  { name: "Donat", desc: "Camilan yang pas buat sarapan atau teman santai.", price: "Rp5.000" },
];

const reasons = [
  { icon: Sparkles, title: "Sederhana", desc: "Tampilan gampang dipahami, nggak perlu jago teknologi." },
  { icon: Zap, title: "Praktis", desc: "Catat produk, stok, dan penjualan cukup dari HP." },
  { icon: ShieldCheck, title: "Terpercaya", desc: "Data usahamu tersimpan rapi dan bisa dicek kapan saja." },
];

const features = [
  { icon: LayoutDashboard, name: "Dashboard" },
  { icon: Package, name: "Produk" },
  { icon: Boxes, name: "Stok" },
  { icon: ShoppingCart, name: "Penjualan" },
  { icon: Wallet, name: "Keuangan" },
  { icon: FileBarChart, name: "Laporan" },
];

const faqs = [
  { q: "UMKM Manager itu apa sih?", a: "Platform digital buat bantu UMKM kuliner mencatat produk, stok, penjualan, keuangan, dan laporan dalam satu tempat." },
  { q: "Cocok buat usaha kecil?", a: "Cocok banget. UMKM Manager memang dibuat untuk UMKM kuliner mikro dan kecil." },
  { q: "Bisa dipakai lewat HP?", a: "Bisa. Tampilannya dibuat ramah di HP supaya praktis dipakai di mana saja." },
  { q: "Fitur apa saja yang tersedia?", a: "Ada Dashboard, Produk, Stok, Penjualan, Keuangan, dan Laporan." },
  { q: "Gimana cara pesan atau tanya-tanya?", a: "Isi form pesanan di bawah atau hubungi kami lewat WhatsApp." },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-secondary/60 text-muted-foreground">
      <ImageIcon className="h-8 w-8 text-primary/60" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

function Section({ id, eyebrow, title, children, className = "" }: { id?: string; eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`px-5 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

const field = "w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

function Index() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">UM</span>
            UMKM Manager
          </a>
          <a href="#pesan" className="text-sm font-medium text-primary hover:underline">Pesan</a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-16 pt-12 md:pt-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Untuk UMKM kuliner di Bekasi</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Usaha kuliner makin rapi, <span className="text-primary">tanpa ribet.</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Catat produk, stok, penjualan, sampai laporan keuangan — semua dalam satu tempat yang gampang dipakai.
            </p>
            <a href="#kontak" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5">
              <MessageCircle className="h-5 w-5" /> Pesan via WhatsApp
            </a>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-xl shadow-primary/10">
            <p className="text-sm font-semibold">Fitur UMKM Manager</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {features.map((f) => (
                <div key={f.name} className="flex flex-col items-center gap-2 rounded-xl bg-muted p-3 text-center">
                  <f.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Contoh produk UMKM" title="Produk unggulan" className="bg-card">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.map((p) => (
            <article key={p.name} className="rounded-2xl border border-border bg-background p-4">
              <Placeholder label={`Foto ${p.name}`} />
              <h3 className="mt-4 text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-4 text-lg font-bold text-primary">{p.price}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Keunggulan" title="Kenapa memilih kami">
        <div className="grid gap-5 md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Tentang kami" title="Teman digital UMKM kuliner" className="bg-card">
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          UMKM Manager hadir di Bekasi untuk membantu pelaku UMKM kuliner mikro dan kecil mengelola usahanya dengan lebih rapi.
          Kami percaya, mencatat produk, stok, dan keuangan nggak harus rumit — cukup sederhana, praktis, dan bisa dipercaya.
        </p>
      </Section>

      <Section eyebrow="FAQ" title="Pertanyaan yang sering ditanya">
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-xl bg-card p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-primary transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section id="pesan" eyebrow="Form pesanan" title="Yuk, pesan sekarang" className="bg-card">
        <form onSubmit={(e) => e.preventDefault()} className="grid max-w-xl gap-4 rounded-2xl bg-background p-6">
          <label className="grid gap-1.5 text-sm font-medium">Nama
            <input className={field} placeholder="Nama kamu" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Produk
            <select className={field} defaultValue="">
              <option value="" disabled>Pilih produk</option>
              {products.map((p) => <option key={p.name}>{p.name} — {p.price}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Jumlah
            <input type="number" min={1} defaultValue={1} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Catatan
            <textarea rows={3} className={field} placeholder="Catatan tambahan (opsional)" />
          </label>
          <button className="rounded-full bg-primary py-3.5 font-semibold text-primary-foreground transition hover:opacity-90">Kirim Pesanan</button>
        </form>
      </Section>

      <footer id="kontak" className="bg-accent px-5 py-14 text-accent-foreground">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold">Kontak</h2>
          <ul className="mt-6 grid gap-4 text-sm md:grid-cols-3">
            <li className="flex gap-3"><MessageCircle className="h-5 w-5 shrink-0" /><span><b>WhatsApp</b><br />{NA}</span></li>
            <li className="flex gap-3"><Instagram className="h-5 w-5 shrink-0" /><span><b>Instagram</b><br />{NA}</span></li>
            <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0" /><span><b>Alamat</b><br />{NA} (Area layanan: Bekasi)</span></li>
          </ul>
          <p className="mt-10 border-t border-accent-foreground/15 pt-6 text-xs">© {new Date().getFullYear()} UMKM Manager. Sederhana · Praktis · Terpercaya.</p>
        </div>
      </footer>
    </div>
  );
}
