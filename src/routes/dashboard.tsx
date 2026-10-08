import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  FileBarChart,
  ArrowLeft,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Download,
  Trash2,
  Store,
  ChevronRight,
  Database,
  RefreshCw,
  Image as ImageIcon,
  Cloud,
  ExternalLink,
} from "lucide-react";
import {
  db,
  DB_UPDATED_EVENT,
  Product,
  Order,
  CashTransaction,
  DEFAULT_PRODUCTS,
  DEFAULT_ORDERS,
  DEFAULT_CASHFLOW,
} from "@/lib/database";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search["tab"] as string) || "dashboard",
  }),
  component: DashboardPage,
});

type TabType = "dashboard" | "produk" | "stok" | "penjualan" | "keuangan" | "laporan";

function DashboardPage() {
  const search = useSearch({ from: "/dashboard" });
  const [activeTab, setActiveTab] = useState<TabType>((search.tab as TabType) || "dashboard");

  // Database-backed states
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);
  const [cashflow, setCashflow] = useState<CashTransaction[]>(DEFAULT_CASHFLOW);

  // Function to sync state from db
  const reloadData = () => {
    setProducts(db.getProducts());
    setOrders(db.getOrders());
    setCashflow(db.getCashflow());
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener(DB_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DB_UPDATED_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    if (
      search.tab &&
      ["dashboard", "produk", "stok", "penjualan", "keuangan", "laporan"].includes(search.tab)
    ) {
      setActiveTab(search.tab as TabType);
    }
  }, [search.tab]);

  // Modal states
  const [modalType, setModalType] = useState<"product" | "order" | "cash" | "supabase" | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  // Form states - Product
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Donat");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pImage, setPImage] = useState("");

  // Form states - Order
  const [oCustomer, setOCustomer] = useState("");
  const [oProduct, setOProduct] = useState("");
  const [oTotal, setOTotal] = useState("");
  const [oStatus, setOStatus] = useState<Order["status"]>("Selesai");

  // Form states - Cashflow
  const [cDesc, setCDesc] = useState("");
  const [cType, setCType] = useState<"in" | "out">("in");
  const [cAmount, setCAmount] = useState("");
  const [cCategory, setCCategory] = useState("Penjualan");

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice) return;
    db.addProduct({
      name: pName,
      category: pCategory,
      price: parseInt(pPrice, 10) || 0,
      stock: parseInt(pStock, 10) || 0,
      image: pImage,
    });
    setPName("");
    setPPrice("");
    setPStock("");
    setPImage("");
    setModalType(null);
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oCustomer || !oTotal) return;
    db.addOrder({
      customer: oCustomer,
      product: oProduct || "Pesanan Produk",
      total: parseInt(oTotal, 10) || 0,
      status: oStatus,
    });
    setOCustomer("");
    setOProduct("");
    setOTotal("");
    setModalType(null);
  };

  const handleAddCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cDesc || !cAmount) return;
    db.addCashTransaction({
      desc: cDesc,
      type: cType,
      amount: parseInt(cAmount, 10) || 0,
      category: cCategory,
    });
    setCDesc("");
    setCAmount("");
    setModalType(null);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(db.exportBackup());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `backup_umkm_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    if (confirm("Reset data kembali ke menu contoh Donat & Cookies bawaan?")) {
      db.seedBakeryData();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await db.syncWithSupabase();
    reloadData();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Calculations
  const totalOmzet = cashflow.filter((c) => c.type === "in").reduce((sum, c) => sum + c.amount, 0);
  const totalPengeluaran = cashflow
    .filter((c) => c.type === "out")
    .reduce((sum, c) => sum + c.amount, 0);
  const labaBersih = totalOmzet - totalPengeluaran;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const navItems = [
    { id: "dashboard" as TabType, name: "Dashboard", icon: LayoutDashboard, badge: "" },
    {
      id: "produk" as TabType,
      name: "Katalog Produk",
      icon: Package,
      badge: products.length ? `${products.length}` : "",
    },
    {
      id: "stok" as TabType,
      name: "Manajemen Stok",
      icon: Boxes,
      badge: lowStockCount ? `${lowStockCount} Menipis` : "",
    },
    {
      id: "penjualan" as TabType,
      name: "Penjualan",
      icon: ShoppingCart,
      badge: orders.length ? `${orders.length}` : "",
    },
    { id: "keuangan" as TabType, name: "Keuangan & Kas", icon: Wallet, badge: "" },
    { id: "laporan" as TabType, name: "Laporan Bisnis", icon: FileBarChart, badge: "" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card p-4 md:flex">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-md shadow-primary/20">
              DC
            </span>
            <div className="leading-tight">
              <span className="block text-sm font-bold">Donat & Cookies</span>
              <span className="block text-[11px] font-normal text-muted-foreground">
                Toko & Kasir Bekasi
              </span>
            </div>
          </Link>
        </div>

        {/* Database indicator */}
        <div
          className={`mb-4 rounded-xl border p-3 text-xs ${
            db.isCloudConnected()
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
              : "border-primary/20 bg-primary/5 text-foreground"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Database
                className={`h-3.5 w-3.5 ${
                  db.isCloudConnected() ? "text-emerald-600" : "text-primary"
                }`}
              />
              <span
                className={
                  db.isCloudConnected()
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-primary font-bold"
                }
              >
                {db.isCloudConnected() ? "Supabase Cloud Aktif" : "Mode Database Lokal"}
              </span>
            </div>
            <span
              className={`h-2 w-2 rounded-full ${
                db.isCloudConnected() ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            {db.isCloudConnected()
              ? "Tersinkronisasi otomatis dengan PostgreSQL di Supabase."
              : "Data tersimpan di browser. Hubungkan Supabase untuk Cloud."}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            {db.isCloudConnected() ? (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Menyinkronkan..." : "Sync Sekarang"}
              </button>
            ) : (
              <button
                onClick={() => setModalType("supabase")}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <Cloud className="h-3 w-3" />
                Setup Supabase
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border pt-4 space-y-2">
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Backup Data (JSON)</span>
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Website Utama</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold capitalize tracking-tight md:text-xl">
              {navItems.find((n) => n.id === activeTab)?.name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {db.isCloudConnected() ? (
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Terhubung
              </span>
            ) : (
              <button
                onClick={() => setModalType("supabase")}
                className="hidden items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 sm:inline-flex"
                title="Klik untuk panduan setup Supabase"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Mode Lokal (Klik Setup Cloud)
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === "produk" || activeTab === "stok") setModalType("product");
                else if (activeTab === "penjualan") setModalType("order");
                else if (activeTab === "keuangan") setModalType("cash");
                else setModalType("product");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Input Data Baru</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lihat Toko Publik</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Horizontal Bar */}
        <div className="flex overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Main Tab Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Omzet
                    </p>
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">
                    Rp {totalOmzet.toLocaleString("id-ID")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cashflow.filter((c) => c.type === "in").length} Transaksi Pemasukan
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Pesanan
                    </p>
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">{orders.length} Pesanan</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Tercatat dalam sistem</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Produk Terdaftar
                    </p>
                    <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">{products.length} Menu</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Katalog aktif</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Peringatan Stok
                    </p>
                    <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">{lowStockCount} Menipis</h3>
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    {lowStockCount ? "Perlu restock segera" : "Stok terkendali"}
                  </p>
                </div>
              </div>

              {/* Empty State Banner if no data at all */}
              {products.length === 0 && orders.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Database className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">Database Masih Kosong</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Belum ada data bawaan. Silakan mulai memasukkan produk menu kuliner Anda
                    sekarang untuk mengaktifkan sistem.
                  </p>
                  <button
                    onClick={() => setModalType("product")}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Input Produk Pertama Anda
                  </button>
                </div>
              )}

              {/* Recent Orders Table */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Pesanan Terkini</h3>
                  <button
                    onClick={() => setModalType("order")}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    + Catat Pesanan Baru
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Belum ada catatan pesanan masuk.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{ord.customer}</p>
                          <p className="text-xs text-muted-foreground">
                            {ord.product} · {ord.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            Rp {ord.total.toLocaleString("id-ID")}
                          </p>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUK */}
          {activeTab === "produk" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Katalog Produk UMKM</h2>
                  <p className="text-sm text-muted-foreground">
                    Daftar produk kuliner yang Anda kelola sendiri.
                  </p>
                </div>
                <button
                  onClick={() => setModalType("product")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Tambah Produk Baru
                </button>
              </div>

              {products.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base font-bold">Belum Ada Produk</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Katalog masih kosong. Klik tombol di bawah untuk mulai menginput produk Anda.
                  </p>
                  <button
                    onClick={() => setModalType("product")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" /> Tambah Produk
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden bg-muted flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                            {p.category}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Stok: {p.stock}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold">{p.name}</h3>
                        <p className="mt-1 text-base font-extrabold text-primary">
                          Rp {p.price.toLocaleString("id-ID")}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <button
                            onClick={() => db.updateStock(p.id, 5)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            + Tambah 5 Stok
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus produk ${p.name}?`)) db.deleteProduct(p.id);
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STOK */}
          {activeTab === "stok" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Manajemen Inventaris Stok</h2>
                  <p className="text-sm text-muted-foreground">
                    Pantau dan ubah stok produk kuliner Anda langsung di sini.
                  </p>
                </div>
                <button
                  onClick={() => setModalType("product")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Tambah Produk Baru
                </button>
              </div>

              {products.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
                  <Boxes className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base font-bold">Belum Ada Data Stok</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tambahkan produk terlebih dahulu untuk memantau stok.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-4">Produk</th>
                        <th className="p-4">Sisa Stok</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Sesuaikan Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition">
                          <td className="p-4 font-semibold">
                            <div>{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.category}</div>
                          </td>
                          <td className="p-4 font-bold text-base">{p.stock} pcs</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                p.stock > 5
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {p.stock > 5 ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5" />
                              )}
                              {p.stock > 5 ? "Aman" : "Menipis"}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => db.updateStock(p.id, -1)}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold hover:bg-muted"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => db.updateStock(p.id, 1)}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold hover:bg-muted"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => db.updateStock(p.id, 10)}
                              className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                            >
                              +10 Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PENJUALAN */}
          {activeTab === "penjualan" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Daftar Transaksi Penjualan</h2>
                  <p className="text-sm text-muted-foreground">
                    Catat pesanan dari pembeli secara manual atau otomatis.
                  </p>
                </div>
                <button
                  onClick={() => setModalType("order")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Catat Pesanan Baru
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base font-bold">Belum Ada Transaksi Penjualan</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Klik 'Catat Pesanan Baru' untuk memasukkan transaksi pertama.
                  </p>
                  <button
                    onClick={() => setModalType("order")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" /> Catat Pesanan
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Pelanggan</th>
                        <th className="p-4">Menu Dipesan</th>
                        <th className="p-4">Total Harga</th>
                        <th className="p-4">Waktu</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-muted/30 transition">
                          <td className="p-4 font-mono text-xs text-muted-foreground">{ord.id}</td>
                          <td className="p-4 font-semibold">{ord.customer}</td>
                          <td className="p-4">{ord.product}</td>
                          <td className="p-4 font-bold text-primary">
                            Rp {ord.total.toLocaleString("id-ID")}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">{ord.date}</td>
                          <td className="p-4">
                            <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm("Hapus catatan order ini?")) db.deleteOrder(ord.id);
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KEUANGAN */}
          {activeTab === "keuangan" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Buku Kas & Keuangan UMKM</h2>
                  <p className="text-sm text-muted-foreground">
                    Catatan arus kas pemasukan dan pengeluaran modal.
                  </p>
                </div>
                <button
                  onClick={() => setModalType("cash")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Catat Kas / Transaksi
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium text-muted-foreground">Total Pemasukan</p>
                  <h3 className="mt-2 text-2xl font-bold text-emerald-600">
                    Rp {totalOmzet.toLocaleString("id-ID")}
                  </h3>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium text-muted-foreground">Total Pengeluaran</p>
                  <h3 className="mt-2 text-2xl font-bold text-rose-500">
                    Rp {totalPengeluaran.toLocaleString("id-ID")}
                  </h3>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium text-muted-foreground">Estimasi Laba Bersih</p>
                  <h3 className="mt-2 text-2xl font-bold text-primary">
                    Rp {labaBersih.toLocaleString("id-ID")}
                  </h3>
                </div>
              </div>

              {/* Transaction list */}
              {cashflow.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
                  <Wallet className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base font-bold">Belum Ada Transaksi Kas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Catat pengeluaran belanja bahan baku atau pemasukan di sini.
                  </p>
                  <button
                    onClick={() => setModalType("cash")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" /> Catat Kas
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="p-4 border-b border-border font-bold text-sm">
                    Riwayat Mutasi Kas
                  </div>
                  <div className="divide-y divide-border">
                    {cashflow.map((cf) => (
                      <div
                        key={cf.id}
                        className="p-4 flex items-center justify-between hover:bg-muted/20"
                      >
                        <div>
                          <p className="font-semibold text-sm">{cf.desc}</p>
                          <p className="text-xs text-muted-foreground">
                            {cf.category} · {cf.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-sm font-bold ${
                              cf.type === "in" ? "text-emerald-600" : "text-rose-500"
                            }`}
                          >
                            {cf.type === "in" ? "+" : "-"} Rp {cf.amount.toLocaleString("id-ID")}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Hapus catatan ini?")) db.deleteCashTransaction(cf.id);
                            }}
                            className="text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LAPORAN */}
          {activeTab === "laporan" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Laporan Kinerja Usaha</h2>
                  <p className="text-sm text-muted-foreground">
                    Ringkasan performa penjualan dan kas UMKM Anda.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    <Download className="h-4 w-4" /> Download JSON
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                  >
                    Cetak / Simpan PDF
                  </button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm">Ringkasan Keuangan Saat Ini</h3>
                  <ul className="divide-y divide-border text-sm">
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Total Pemasukan</span>
                      <span className="font-bold text-emerald-600">
                        Rp {totalOmzet.toLocaleString("id-ID")}
                      </span>
                    </li>
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Total Pengeluaran</span>
                      <span className="font-bold text-rose-500">
                        Rp {totalPengeluaran.toLocaleString("id-ID")}
                      </span>
                    </li>
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Estimasi Laba Bersih</span>
                      <span className="font-bold text-primary">
                        Rp {labaBersih.toLocaleString("id-ID")}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm">Aktivitas Operasional</h3>
                  <ul className="divide-y divide-border text-sm">
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Total Menu Terdaftar</span>
                      <span className="font-bold">{products.length} Menu</span>
                    </li>
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Total Transaksi Selesai</span>
                      <span className="font-bold">{orders.length} Transaksi</span>
                    </li>
                    <li className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Status Database</span>
                      <span className="font-bold text-emerald-600">Tersinkronisasi</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-600">
                    Reset Data Contoh (Donat & Cookies)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Kembalikan data katalog ke contoh produk Donat & Cookies bawaan.
                  </p>
                </div>
                <button
                  onClick={handleResetData}
                  className="rounded-xl border border-rose-500/30 bg-card px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500 hover:text-white transition"
                >
                  Reset ke Data Donat & Cookies
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: TAMBAH PRODUK */}
      {modalType === "product" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">Input Produk Baru</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Masukkan rincian produk yang ingin Anda jual.
            </p>
            <form onSubmit={handleAddProduct} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Nama Produk *</label>
                <input
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Contoh: Brownies Cokelat Lumer"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Kategori</label>
                  <input
                    list="category-suggestions"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    placeholder="Donat / Cookies / Lainnya"
                    className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                  />
                  <datalist id="category-suggestions">
                    <option value="Donat" />
                    <option value="Cookies" />
                    <option value="Pastry" />
                    <option value="Kue & Roti" />
                    <option value="Minuman" />
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold">Harga (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    placeholder="25000"
                    className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Stok Awal</label>
                <input
                  type="number"
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  placeholder="Contoh: 20"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">URL Foto Produk (Opsional)</label>
                <input
                  value={pImage}
                  onChange={(e) => setPImage(e.target.value)}
                  placeholder="Contoh: /images/products/brownies-cokelat.jpg atau link gambar"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  Simpan ke Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT PESANAN */}
      {modalType === "order" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">Catat Pesanan Baru</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Masukkan data transaksi penjualan pelanggan.
            </p>
            <form onSubmit={handleAddOrder} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Nama Pelanggan *</label>
                <input
                  required
                  value={oCustomer}
                  onChange={(e) => setOCustomer(e.target.value)}
                  placeholder="Contoh: Ibu Rina (Bekasi Barat)"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Menu / Produk yang Dipesan</label>
                {products.length > 0 ? (
                  <select
                    value={oProduct}
                    onChange={(e) => {
                      setOProduct(e.target.value);
                      const selected = products.find((p) => p.name === e.target.value);
                      if (selected) setOTotal(selected.price.toString());
                    }}
                    className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                  >
                    <option value="">Pilih dari produk terdaftar...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} - Rp {p.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={oProduct}
                    onChange={(e) => setOProduct(e.target.value)}
                    placeholder="Contoh: 2 Box Brownies Cokelat"
                    className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold">Total Pembayaran (Rp) *</label>
                <input
                  required
                  type="number"
                  value={oTotal}
                  onChange={(e) => setOTotal(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Status Pesanan</label>
                <select
                  value={oStatus}
                  onChange={(e) => setOStatus(e.target.value as Order["status"])}
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                >
                  <option value="Selesai">Selesai (Sudah Dibayar)</option>
                  <option value="Proses">Sedang Diproses</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CATAT KAS / KEUANGAN */}
      {modalType === "cash" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">Catat Arus Kas / Keuangan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catat uang masuk (omzet) atau uang keluar (beli bahan/operasional).
            </p>
            <form onSubmit={handleAddCash} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Jenis Transaksi</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCType("in");
                      setCCategory("Penjualan");
                    }}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      cType === "in"
                        ? "bg-emerald-500 text-white"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    + Pemasukan (Omzet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCType("out");
                      setCCategory("Bahan Baku");
                    }}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      cType === "out"
                        ? "bg-rose-500 text-white"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    - Pengeluaran (Beban/Bahan)
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Keterangan *</label>
                <input
                  required
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder={
                    cType === "in"
                      ? "Contoh: Penjualan bazar kuliner"
                      : "Contoh: Beli mentega & telur 5kg"
                  }
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Jumlah Nominal (Rp) *</label>
                <input
                  required
                  type="number"
                  value={cAmount}
                  onChange={(e) => setCAmount(e.target.value)}
                  placeholder="50000"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Kategori</label>
                <input
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  placeholder="Contoh: Bahan Baku / Operasional / Penjualan"
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  Simpan ke Buku Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PANDUAN INTEGRASI SUPABASE */}
      {modalType === "supabase" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Koneksi Database Supabase</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Sinkronisasi Cloud PostgreSQL multi-perangkat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    1
                  </span>
                  Buat Project Supabase Gratis
                </p>
                <p className="pl-5 leading-relaxed text-muted-foreground">
                  Buka{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary underline"
                  >
                    supabase.com <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  , buat akun lalu klik <b>New Project</b> (pilih region terdekat, misalnya
                  Singapore).
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    2
                  </span>
                  Jalankan SQL Schema Tabel
                </p>
                <p className="pl-5 leading-relaxed text-muted-foreground">
                  File schema lengkap sudah dibuat di folder proyek Anda:{" "}
                  <code className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] text-primary">
                    supabase-schema.sql
                  </code>
                  . Buka menu <b>SQL Editor</b> di Supabase Dashboard, salin isinya, lalu klik{" "}
                  <b>Run</b>.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    3
                  </span>
                  Salin Kunci API ke file .env
                </p>
                <p className="pl-5 leading-relaxed text-muted-foreground">
                  Buka <b>Project Settings → API</b> di Supabase, salin URL & anon key, lalu
                  masukkan ke file{" "}
                  <code className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px]">
                    .env
                  </code>
                  :
                </p>
                <div className="ml-5 rounded-lg border border-border bg-background p-2.5 font-mono text-[11px] text-foreground">
                  <p>VITE_SUPABASE_URL=https://proyek-anda.supabase.co</p>
                  <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
