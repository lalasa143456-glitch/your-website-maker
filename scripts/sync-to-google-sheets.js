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

const orders = [];

const cashflow = [
  { id: "TX-101", desc: "Saldo / Modal Kas Awal Toko", type: "in", category: "Modal", amount: 500000, date: "Hari Ini" },
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
