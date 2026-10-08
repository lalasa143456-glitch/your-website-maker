import { supabase, isSupabaseConfigured } from "./supabase";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  image?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  total: number;
  date: string;
  status: "Pending" | "Proses" | "Selesai" | "Dibatalkan";
  notes?: string;
}

export interface CashTransaction {
  id: string;
  desc: string;
  type: "in" | "out";
  amount: number;
  date: string;
  category: string;
}

const STORAGE_KEYS = {
  PRODUCTS: "umkm_db_products",
  ORDERS: "umkm_db_orders",
  CASHFLOW: "umkm_db_cashflow",
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "PRD-DONAT-1",
    name: "Donat Klasik Gula Salju",
    category: "Donat",
    price: 8000,
    stock: 40,
    sold: 125,
    image: "/images/products/donat.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "PRD-DONAT-2",
    name: "Donat Bomboloni Nutella Lumer",
    category: "Donat",
    price: 12000,
    stock: 25,
    sold: 94,
    image: "/images/products/donat-bomboloni.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "PRD-DONAT-3",
    name: "Donat Tiramisu Almond Crunch",
    category: "Donat",
    price: 11000,
    stock: 30,
    sold: 78,
    image: "/images/products/donat-tiramisu.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "PRD-COOKIE-1",
    name: "Classic Choco Chip Cookies",
    category: "Cookies",
    price: 15000,
    stock: 30,
    sold: 86,
    image: "/images/products/cookies-cokelat.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "PRD-COOKIE-2",
    name: "Red Velvet Marshmallow Cookies",
    category: "Cookies",
    price: 18000,
    stock: 20,
    sold: 62,
    image: "/images/products/cookies-red-velvet.jpg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "PRD-COOKIE-3",
    name: "Matcha White Choco Cookies",
    category: "Cookies",
    price: 16000,
    stock: 24,
    sold: 55,
    image: "/images/products/cookies-matcha.jpg",
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-101",
    customer: "Dinda (Bekasi Barat)",
    product: "Donat Bomboloni Nutella Lumer (2 pcs)",
    total: 24000,
    date: "Hari Ini, 08:30",
    status: "Selesai",
    notes: "Tolong banyakin taburan gula halusnya ya",
  },
  {
    id: "ORD-102",
    customer: "Bimo (Summarecon Bekasi)",
    product: "Red Velvet Marshmallow Cookies (3 pcs)",
    total: 54000,
    date: "Hari Ini, 09:15",
    status: "Proses",
    notes: "Kirim pakai kurir instan",
  },
];

export const DEFAULT_CASHFLOW: CashTransaction[] = [
  {
    id: "TX-201",
    desc: "Penjualan ORD-101 (Dinda)",
    type: "in",
    amount: 24000,
    date: "Hari Ini, 08:30",
    category: "Penjualan",
  },
  {
    id: "TX-202",
    desc: "Beli Tepung Terigu Protein Sedang & Mentega",
    type: "out",
    amount: 65000,
    date: "Kemarin, 14:00",
    category: "Bahan Baku",
  },
];

// Event emitter to notify React components across the app
export const DB_UPDATED_EVENT = "umkm_database_updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DB_UPDATED_EVENT));
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emitUpdate();
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Inisialisasi sinkronisasi Supabase di background
let isSyncInitialized = false;

async function syncFromSupabase() {
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    // 1. Fetch Products
    const { data: remoteProducts, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!prodErr && remoteProducts) {
      const mappedProducts: Product[] = remoteProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Umum",
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        sold: Number(p.sold) || 0,
        image: p.image || "",
        createdAt: p.created_at || new Date().toISOString(),
      }));

      // Jika remote ada isinya, update local cache
      if (mappedProducts.length > 0) {
        setItem(STORAGE_KEYS.PRODUCTS, mappedProducts);
      } else {
        // Jika remote masih kosong, tapi ada produk lokal, bantu migrasikan ke Supabase
        const localProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
        if (localProducts.length > 0) {
          const payload = localProducts.map((lp) => ({
            id: lp.id,
            name: lp.name,
            category: lp.category,
            price: lp.price,
            stock: lp.stock,
            sold: lp.sold,
            image: lp.image || "",
            created_at: lp.createdAt,
          }));
          await supabase.from("products").upsert(payload);
        }
      }
    }

    // 2. Fetch Orders
    const { data: remoteOrders, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!orderErr && remoteOrders) {
      const mappedOrders: Order[] = remoteOrders.map((o) => ({
        id: o.id,
        customer: o.customer,
        product: o.product,
        total: Number(o.total) || 0,
        date: o.date,
        status: o.status as Order["status"],
        notes: o.notes || "",
      }));
      if (mappedOrders.length > 0) {
        setItem(STORAGE_KEYS.ORDERS, mappedOrders);
      }
    }

    // 3. Fetch Cashflow
    const { data: remoteCashflow, error: cashErr } = await supabase
      .from("cashflow")
      .select("*")
      .order("created_at", { ascending: false });

    if (!cashErr && remoteCashflow) {
      const mappedCashflow: CashTransaction[] = remoteCashflow.map((c) => ({
        id: c.id,
        desc: c.desc,
        type: c.type as "in" | "out",
        amount: Number(c.amount) || 0,
        date: c.date,
        category: c.category || "Umum",
      }));
      if (mappedCashflow.length > 0) {
        setItem(STORAGE_KEYS.CASHFLOW, mappedCashflow);
      }
    }
  } catch (err) {
    console.warn("Gagal sinkronisasi dengan Supabase:", err);
  }
}

function initSupabaseRealtime(): void {
  if (typeof window === "undefined" || isSyncInitialized) return;
  if (!isSupabaseConfigured() || !supabase) return;

  isSyncInitialized = true;
  syncFromSupabase();

  // Dengarkan perubahan real-time dari Supabase
  try {
    const activeClient = supabase;
    activeClient
      .channel("umkm_realtime_changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        syncFromSupabase();
      })
      .subscribe();
  } catch (e) {
    console.warn("Realtime subscription error:", e);
  }
}

// Jalankan realtime sync saat runtime di browser
if (typeof window !== "undefined") {
  initSupabaseRealtime();
}

export const db = {
  // STATUS KONEKSI
  isCloudConnected(): boolean {
    return isSupabaseConfigured();
  },
  async syncWithSupabase(): Promise<void> {
    await syncFromSupabase();
  },

  // PRODUCTS
  getProducts(): Product[] {
    const list = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    if (list.length === 0) {
      setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return list;
  },
  addProduct(input: {
    name: string;
    category?: string;
    price: number;
    stock: number;
    image?: string;
  }): Product {
    const list = this.getProducts();
    const newProduct: Product = {
      id: "PRD-" + Date.now().toString(36).toUpperCase(),
      name: input.name,
      category: input.category || "Umum",
      price: input.price,
      stock: input.stock,
      sold: 0,
      image: input.image || "",
      createdAt: new Date().toISOString(),
    };

    // Update Local Cache langsung (optimistic)
    setItem(STORAGE_KEYS.PRODUCTS, [newProduct, ...list]);

    // Kirim ke Supabase jika terhubung
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("products")
        .insert({
          id: newProduct.id,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          sold: newProduct.sold,
          image: newProduct.image,
          created_at: newProduct.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error("Gagal simpan produk ke Supabase:", error);
        });
    }

    return newProduct;
  },
  updateStock(id: string, delta: number) {
    let targetProduct: Product | undefined;
    const list = this.getProducts().map((p) => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + delta);
        targetProduct = { ...p, stock: newStock };
        return targetProduct;
      }
      return p;
    });

    setItem(STORAGE_KEYS.PRODUCTS, list);

    if (targetProduct && isSupabaseConfigured() && supabase) {
      supabase
        .from("products")
        .update({ stock: targetProduct.stock })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Gagal update stok ke Supabase:", error);
        });
    }
  },
  deleteProduct(id: string) {
    const list = this.getProducts().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, list);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("products")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Gagal hapus produk di Supabase:", error);
        });
    }
  },

  // ORDERS / PENJUALAN
  getOrders(): Order[] {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    if (list.length === 0) {
      setItem(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
      return DEFAULT_ORDERS;
    }
    return list;
  },
  addOrder(input: {
    customer: string;
    product: string;
    total: number;
    notes?: string;
    status?: Order["status"];
  }): Order {
    const list = this.getOrders();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newOrder: Order = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      customer: input.customer,
      product: input.product,
      total: input.total,
      date: dateFormatted,
      status: input.status || "Proses",
      notes: input.notes || "",
    };

    setItem(STORAGE_KEYS.ORDERS, [newOrder, ...list]);

    // Kirim ke Supabase jika terhubung
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("orders")
        .insert({
          id: newOrder.id,
          customer: newOrder.customer,
          product: newOrder.product,
          total: newOrder.total,
          date: newOrder.date,
          status: newOrder.status,
          notes: newOrder.notes,
        })
        .then(({ error }) => {
          if (error) console.error("Gagal simpan pesanan ke Supabase:", error);
        });
    }

    // Otomatis catat pemasukan kas saat order dibuat jika selesai/proses
    this.addCashTransaction({
      desc: `Penjualan ${newOrder.id} (${newOrder.customer})`,
      type: "in",
      amount: newOrder.total,
      category: "Penjualan",
    });

    return newOrder;
  },
  updateOrderStatus(id: string, status: Order["status"]) {
    const list = this.getOrders().map((o) => (o.id === id ? { ...o, status } : o));
    setItem(STORAGE_KEYS.ORDERS, list);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Gagal update status pesanan di Supabase:", error);
        });
    }
  },
  deleteOrder(id: string) {
    const list = this.getOrders().filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.ORDERS, list);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("orders")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Gagal hapus pesanan di Supabase:", error);
        });
    }
  },

  // CASHFLOW / KEUANGAN
  getCashflow(): CashTransaction[] {
    const list = getItem<CashTransaction[]>(STORAGE_KEYS.CASHFLOW, []);
    if (list.length === 0) {
      setItem(STORAGE_KEYS.CASHFLOW, DEFAULT_CASHFLOW);
      return DEFAULT_CASHFLOW;
    }
    return list;
  },
  addCashTransaction(input: {
    desc: string;
    type: "in" | "out";
    amount: number;
    category?: string;
  }): CashTransaction {
    const list = this.getCashflow();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newTx: CashTransaction = {
      id: "TX-" + Math.floor(1000 + Math.random() * 9000),
      desc: input.desc,
      type: input.type,
      amount: input.amount,
      date: dateFormatted,
      category: input.category || (input.type === "in" ? "Pemasukan" : "Pengeluaran"),
    };

    setItem(STORAGE_KEYS.CASHFLOW, [newTx, ...list]);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("cashflow")
        .insert({
          id: newTx.id,
          desc: newTx.desc,
          type: newTx.type,
          amount: newTx.amount,
          date: newTx.date,
          category: newTx.category,
        })
        .then(({ error }) => {
          if (error) console.error("Gagal simpan transaksi ke Supabase:", error);
        });
    }

    return newTx;
  },
  deleteCashTransaction(id: string) {
    const list = this.getCashflow().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CASHFLOW, list);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("cashflow")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Gagal hapus transaksi di Supabase:", error);
        });
    }
  },

  // BACKUP & RESET
  exportBackup(): string {
    return JSON.stringify(
      {
        products: this.getProducts(),
        orders: this.getOrders(),
        cashflow: this.getCashflow(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  },
  clearAll() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CASHFLOW);
      emitUpdate();

      if (isSupabaseConfigured() && supabase) {
        Promise.all([
          supabase.from("products").delete().neq("id", ""),
          supabase.from("orders").delete().neq("id", ""),
          supabase.from("cashflow").delete().neq("id", ""),
        ]).catch((err) => console.warn("Supabase clear error:", err));
      }
    }
  },
  seedBakeryData() {
    setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    setItem(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    setItem(STORAGE_KEYS.CASHFLOW, DEFAULT_CASHFLOW);
    emitUpdate();
  },
};
