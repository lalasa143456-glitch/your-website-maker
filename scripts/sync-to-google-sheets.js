// Native fetch in Node.js 18+

const GAS_URL =
  process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbyZh6AAHsau1DJS5w3XOJiSCdVIZ3vrCkju2pFa7b733Qpd_Ocp6X78zx6LyzGyOFdG/exec";

const products = [
  { id: "PRD-DONAT-1", name: "Donat Klasik Gula Salju", category: "Donat", price: 8000, stock: 40, sold: 125 },
  { id: "PRD-DONAT-2", name: "Donat Bomboloni Nutella Lumer", category: "Donat", price: 12000, stock: 25, sold: 94 },
  { id: "PRD-DONAT-3", name: "Donat Tiramisu Almond Crunch", category: "Donat", price: 11000, stock: 30, sold: 78 },
  { id: "PRD-COOKIE-1", name: "Classic Choco Chip Cookies", category: "Cookies", price: 15000, stock: 30, sold: 86 },
  { id: "PRD-COOKIE-2", name: "Red Velvet Marshmallow Cookies", category: "Cookies", price: 18000, stock: 20, sold: 62 },
  { id: "PRD-COOKIE-3", name: "Matcha White Choco Cookies", category: "Cookies", price: 16000, stock: 24, sold: 55 },
];

const orders = [
  { id: "ORD-101", customer: "Dinda (Bekasi Barat)", product: "Donat Bomboloni Nutella Lumer (2 pcs)", total: 24000, status: "Selesai", date: "Hari Ini, 08:30", notes: "Gula halus banyakin" },
  { id: "ORD-102", customer: "Bimo (Summarecon Bekasi)", product: "Red Velvet Marshmallow Cookies (3 pcs)", total: 54000, status: "Proses", date: "Hari Ini, 09:15", notes: "Kurir instan" },
];

const cashflow = [
  { id: "TX-201", desc: "Penjualan ORD-101 (Dinda)", type: "in", category: "Penjualan", amount: 24000, date: "Hari Ini, 08:30" },
  { id: "TX-202", desc: "Beli Tepung Terigu & Mentega", type: "out", category: "Bahan Baku", amount: 65000, date: "Kemarin, 14:00" },
];

async function sync() {
  console.log("Mengirim data ke Google Sheets melalui URL:");
  console.log(GAS_URL);

  const payload = {
    action: "sync_all",
    products,
    orders,
    cashflow,
  };

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Respon dari Google Apps Script:");
    console.log(text);
  } catch (err) {
    console.error("Gagal sinkron:", err);
  }
}

sync();
