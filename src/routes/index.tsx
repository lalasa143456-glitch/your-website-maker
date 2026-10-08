import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  FileBarChart,
  MessageCircle,
  Instagram,
  MapPin,
  ImageIcon,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { db, DB_UPDATED_EVENT, Product, DEFAULT_PRODUCTS } from "@/lib/database";

export const Route = createFileRoute("/")({
  loader: () => ({
    initialProducts: DEFAULT_PRODUCTS,
  }),
  head: () => ({
    meta: [
      { title: "Donat & Cookies Bekasi — Rasa Lembut & Lumer Spesial" },
      {
        name: "description",
        content:
          "Pesan aneka donat kentang lembut, bomboloni lumer, dan soft-baked cookies dibuat fresh setiap hari di Bekasi.",
      },
      { property: "og:title", content: "Donat & Cookies Bekasi — Lembut & Lumer" },
      {
        property: "og:description",
        content: "Spesialis donat dan soft cookies premium rumahan di Bekasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NA = "Informasi belum tersedia.";

const reasons = [
  {
    icon: Sparkles,
    title: "Fresh Tiap Pagi",
    desc: "Donat dan cookies dibuat fresh setiap hari, bukan stok kemarin.",
  },
  {
    icon: Zap,
    title: "Bahan Premium",
    desc: "Menggunakan butter asli dan cokelat lumer berkualitas tanpa pengawet.",
  },
  {
    icon: ShieldCheck,
    title: "Kirim Cepat & Rapi",
    desc: "Kemasan box rapi dan higienis, aman dikirim dengan kurir instan se-Bekasi.",
  },
];

const features = [
  { icon: LayoutDashboard, name: "Dashboard", tab: "dashboard", desc: "Ringkasan & Metrik" },
  { icon: Package, name: "Produk", tab: "produk", desc: "Katalog & Menu" },
  { icon: Boxes, name: "Stok", tab: "stok", desc: "Inventaris Real-time" },
  { icon: ShoppingCart, name: "Penjualan", tab: "penjualan", desc: "Pesanan Masuk" },
  { icon: Wallet, name: "Keuangan", tab: "keuangan", desc: "Buku Kas & Laba" },
  { icon: FileBarChart, name: "Laporan", tab: "laporan", desc: "Analitik Bisnis" },
];

const faqs = [
  {
    q: "Donat dan cookies dibuat fresh setiap hari?",
    a: "Ya! Semua donat dan cookies kami dipanggang dan digoreng fresh setiap pagi dengan bahan premium tanpa pengawet.",
  },
  {
    q: "Bisa pesan untuk hampers atau acara?",
    a: "Bisa banget. Kami melayani pesanan box donat (isi 6 atau 12) serta jar soft cookies untuk arisan, ulang tahun, dan hampers.",
  },
  {
    q: "Bisa pesan lewat mana saja?",
    a: "Anda bisa langsung pesan melalui formulir pesanan di bawah ini atau chat langsung via WhatsApp kami.",
  },
  {
    q: "Berapa lama daya simpan cookies dan donatnya?",
    a: "Donat paling nikmat dikonsumsi dalam 1-2 hari. Untuk soft cookies bisa tahan 7 hari di suhu ruang atau 14 hari di dalam kulkas.",
  },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-secondary/60 text-muted-foreground">
      <ImageIcon className="h-8 w-8 text-primary/60" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
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

const field =
  "w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

function Index() {
  const { initialProducts } = Route.useLoaderData();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(db.getProducts());
    const handleUpdate = () => setProducts(db.getProducts());
    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground font-bold">
              DC
            </span>
            Donat & Cookies Bekasi
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground shadow-sm"
            >
              Masuk Dashboard →
            </Link>
            <a href="#pesan" className="text-sm font-medium text-primary hover:underline">
              Pesan
            </a>
          </div>
        </div>

        {/* Fitur Navigation Strip di Bagian Atas */}
        <div className="border-t border-border/40 bg-muted/30 px-5 py-2">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 overflow-x-auto text-xs">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Fitur Pengelolaan:
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {features.map((f) => (
                <Link
                  key={f.name}
                  to="/dashboard"
                  search={{ tab: f.tab }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/50 bg-background/90 px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-xs"
                >
                  <f.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{f.name}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/dashboard"
              className="hidden md:inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              Semua Fitur →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-16 pt-12 md:pt-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Spesialis Donat & Cookies Rumahan di Bekasi
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Donat lembut & cookies lumer,{" "}
              <span className="text-primary">bikin nagih tiap gigitan.</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Dibuat fresh setiap hari dari butter premium dan cokelat pilihan. Kelola katalog
              produk, stok, dan penjualan makin rapi.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#pesan"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Pesan Sekarang <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/6281213141516?text=Halo%20Donat%20%26%20Cookies,%20saya%20tertarik%20dengan%20produk%20Anda"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 font-semibold text-foreground transition hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Hero Visual Showcase Toko */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card to-secondary/30 p-4 shadow-2xl shadow-primary/10">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src="/images/products/donat-bomboloni.jpg"
                  alt="Donat Bomboloni Nutella Lumer"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
                  🔥 Best Seller
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  Rp 12.000
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                <div>
                  <h3 className="text-base font-bold">Donat Bomboloni Nutella</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Lumer di mulut · Taburan gula salju halus
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <span>★</span> 4.9
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-background object-cover"
                    src="/images/products/cookies-red-velvet.jpg"
                    alt="Cookies"
                  />
                  <img
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-background object-cover"
                    src="/images/products/donat-tiramisu.jpg"
                    alt="Donat"
                  />
                  <img
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-background object-cover"
                    src="/images/products/cookies-cokelat.jpg"
                    alt="Cookies"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium flex-1">
                  +5 varian donat & cookies siap dipesan!
                </span>
                <a
                  href="#pesan"
                  className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"
                >
                  Pesan →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Menu Pilihan" title="Katalog Donat & Cookies Favorit" className="bg-card">
        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-background p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-bold">Katalog Produk Masih Kosong</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Belum ada produk yang diinput. Masuk ke Dashboard untuk menambahkan produk jualan Anda
              sendiri.
            </p>
            <Link
              to="/dashboard"
              search={{ tab: "produk" }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              + Input Produk di Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.category}</p>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-lg font-bold text-primary">
                    Rp {p.price.toLocaleString("id-ID")}
                  </span>
                  <a
                    href="#pesan"
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
                  >
                    Pesan
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
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

      <Section
        eyebrow="Tentang kami"
        title="Baking Fresh Setiap Hari untuk Anda"
        className="bg-card"
      >
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Donat & Cookies Bekasi hadir untuk memanjakan lidah Anda dengan donat kentang bertekstur
          empuk lumer serta artisanal soft cookies ala New York. Dibuat dengan resep istimewa, bahan
          berkualitas, dan penuh cinta di setiap gigitannya.
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const nama = (form.elements.namedItem("nama") as HTMLInputElement)?.value || "";
            const produk = (form.elements.namedItem("produk") as HTMLSelectElement)?.value || "";
            const jumlah = (form.elements.namedItem("jumlah") as HTMLInputElement)?.value || "1";
            const catatan =
              (form.elements.namedItem("catatan") as HTMLTextAreaElement)?.value || "";
            const pesan = encodeURIComponent(
              `Halo Donat & Cookies Bekasi, saya mau pesan:\n\n*Nama:* ${nama}\n*Produk:* ${produk}\n*Jumlah:* ${jumlah}\n*Catatan:* ${catatan || "-"}`,
            );
            window.open(`https://wa.me/6281213141516?text=${pesan}`, "_blank");
          }}
          className="grid max-w-xl gap-4 rounded-2xl bg-background p-6 shadow-sm border border-border"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Nama
            <input name="nama" required className={field} placeholder="Nama kamu" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Produk
            <select name="produk" required className={field} defaultValue="">
              <option value="" disabled>
                Pilih produk
              </option>
              {products.length === 0 ? (
                <option disabled value="">
                  Belum ada produk (tambahkan di Dashboard)
                </option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={`${p.name} (Rp ${p.price.toLocaleString("id-ID")})`}>
                    {p.name} — Rp {p.price.toLocaleString("id-ID")}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Jumlah
            <input name="jumlah" type="number" min={1} defaultValue={1} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Catatan
            <textarea
              name="catatan"
              rows={3}
              className={field}
              placeholder="Catatan tambahan (opsional)"
            />
          </label>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5" /> Kirim Pesanan via WhatsApp
          </button>
        </form>
      </Section>

      <footer id="kontak" className="bg-accent px-5 py-14 text-accent-foreground">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold">Kontak Kami</h2>
          <ul className="mt-6 grid gap-6 text-sm md:grid-cols-3">
            <li className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-foreground/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <b className="block text-base">WhatsApp</b>
                <a
                  href="https://wa.me/6281213141516"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-block text-accent-foreground/90 transition hover:underline hover:text-primary font-medium"
                >
                  081213141516
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-foreground/10 text-primary">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <b className="block text-base">Instagram</b>
                <a
                  href="https://instagram.com/umkmmanager281"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-block text-accent-foreground/90 transition hover:underline hover:text-primary font-medium"
                >
                  @umkmmanager281
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-foreground/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <b className="block text-base">Alamat</b>
                <span className="mt-0.5 block text-accent-foreground/80 leading-relaxed">
                  Bekasi, Jawa Barat, Indonesia
                </span>
              </div>
            </li>
          </ul>
          <p className="mt-10 border-t border-accent-foreground/15 pt-6 text-xs text-accent-foreground/70">
            © {new Date().getFullYear()} Donat & Cookies Bekasi. Fresh · Lembut · Lumer.
          </p>
        </div>
      </footer>
    </div>
  );
}
