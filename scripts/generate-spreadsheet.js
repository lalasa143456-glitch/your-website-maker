import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function createUmkmSpreadsheet() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UMKM Manager - Donat & Cookies Bekasi";
  workbook.lastModifiedBy = "UMKM Manager";
  workbook.created = new Date();
  workbook.modified = new Date();

  // -------------------------------------------------------------
  // SHEET 1: DASHBOARD & RINGKASAN EKSEKUTIF
  // -------------------------------------------------------------
  const dashSheet = workbook.addWorksheet("Dashboard Ringkasan", {
    properties: { tabColor: { argb: "FF107C41" } },
    views: [{ showGridLines: true }],
  });

  dashSheet.columns = [
    { width: 4 },
    { width: 28 },
    { width: 24 },
    { width: 6 },
    { width: 28 },
    { width: 24 },
  ];

  // Title Banner
  dashSheet.mergeCells("B2:F2");
  const titleCell = dashSheet.getCell("B2");
  titleCell.value = "📊 DASHBOARD BISNIS UMKM — DONAT & COOKIES BEKASI";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF107C41" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  dashSheet.getRow(2).height = 36;

  // Subtitle
  dashSheet.mergeCells("B3:F3");
  const subCell = dashSheet.getCell("B3");
  subCell.value = "Dokumen Pembukuan Otomatis Terhubung dengan Website UMKM Manager";
  subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF555555" } };
  subCell.alignment = { vertical: "middle", horizontal: "center" };
  dashSheet.getRow(3).height = 20;

  // KPI Section 1: Keuangan
  dashSheet.getCell("B5").value = "RINGKASAN ARUS KAS & OMZET";
  dashSheet.getCell("B5").font = { name: "Arial", size: 11, bold: true, color: { argb: "FF107C41" } };

  dashSheet.getCell("B6").value = "Total Pemasukan (Omzet)";
  dashSheet.getCell("C6").value = { formula: "SUMIF('Arus Kas'!C:C, \"in\", 'Arus Kas'!E:E)" };
  dashSheet.getCell("C6").numFmt = '"Rp"#,##0';
  dashSheet.getCell("C6").font = { bold: true, color: { argb: "FF107C41" } };

  dashSheet.getCell("B7").value = "Total Pengeluaran (Beban/Bahan)";
  dashSheet.getCell("C7").value = { formula: "SUMIF('Arus Kas'!C:C, \"out\", 'Arus Kas'!E:E)" };
  dashSheet.getCell("C7").numFmt = '"Rp"#,##0';
  dashSheet.getCell("C7").font = { bold: true, color: { argb: "FFD83B01" } };

  dashSheet.getCell("B8").value = "Estimasi Laba Bersih";
  dashSheet.getCell("C8").value = { formula: "C6-C7" };
  dashSheet.getCell("C8").numFmt = '"Rp"#,##0';
  dashSheet.getCell("C8").font = { bold: true, size: 12, color: { argb: "FF004B87" } };

  // KPI Section 2: Operasional Produk & Pesanan
  dashSheet.getCell("E5").value = "RINGKASAN OPERASIONAL TOKO";
  dashSheet.getCell("E5").font = { name: "Arial", size: 11, bold: true, color: { argb: "FF2B579A" } };

  dashSheet.getCell("E6").value = "Total Menu Terdaftar";
  dashSheet.getCell("F6").value = { formula: "COUNTA('Produk & Stok'!A2:A100)" };
  dashSheet.getCell("F6").font = { bold: true };

  dashSheet.getCell("E7").value = "Total Transaksi Pesanan";
  dashSheet.getCell("F7").value = { formula: "COUNTA('Pesanan & Penjualan'!A2:A100)" };
  dashSheet.getCell("F7").font = { bold: true };

  dashSheet.getCell("E8").value = "Total Estimasi Aset Stok";
  dashSheet.getCell("F8").value = { formula: "SUM('Produk & Stok'!G2:G100)" };
  dashSheet.getCell("F8").numFmt = '"Rp"#,##0';
  dashSheet.getCell("F8").font = { bold: true, color: { argb: "FF107C41" } };

  // Border style for KPI
  ["B6", "B7", "B8", "C6", "C7", "C8", "E6", "E7", "E8", "F6", "F7", "F8"].forEach((coord) => {
    dashSheet.getCell(coord).border = {
      top: { style: "thin", color: { argb: "FFD0D0D0" } },
      left: { style: "thin", color: { argb: "FFD0D0D0" } },
      bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
      right: { style: "thin", color: { argb: "FFD0D0D0" } },
    };
  });

  // Petunjuk Integrasi Box
  dashSheet.mergeCells("B11:F14");
  const helpBox = dashSheet.getCell("B11");
  helpBox.value =
    "💡 CARA MENGHUBUNGKAN DOKUMEN INI KE GOOGLE SHEETS & WEBSITE:\n" +
    "1. Buka Google Drive (drive.google.com) lalu Upload file spreadsheet (.xlsx) ini.\n" +
    "2. Buka filenya di Google Sheets -> Klik menu 'Ekstensi' -> 'Apps Script'.\n" +
    "3. Tempel kode dari file 'google-sheets-script.js' di proyek Anda lalu simpan.\n" +
    "4. Menu '🍩 UMKM Manager' otomatis akan muncul di bar atas spreadsheet ini untuk sinkronisasi!";
  helpBox.font = { name: "Arial", size: 9, color: { argb: "FF333333" } };
  helpBox.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7F0" } };
  helpBox.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  helpBox.border = {
    top: { style: "medium", color: { argb: "FF107C41" } },
    bottom: { style: "medium", color: { argb: "FF107C41" } },
    left: { style: "medium", color: { argb: "FF107C41" } },
    right: { style: "medium", color: { argb: "FF107C41" } },
  };

  // -------------------------------------------------------------
  // SHEET 2: PRODUK & STOK
  // -------------------------------------------------------------
  const prodSheet = workbook.addWorksheet("Produk & Stok", {
    properties: { tabColor: { argb: "FF107C41" } },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  prodSheet.columns = [
    { header: "ID Produk", key: "id", width: 16 },
    { header: "Nama Produk", key: "name", width: 34 },
    { header: "Kategori", key: "category", width: 16 },
    { header: "Harga (Rp)", key: "price", width: 16 },
    { header: "Stok", key: "stock", width: 12 },
    { header: "Terjual", key: "sold", width: 12 },
    { header: "Nilai Stok (Rp)", key: "val", width: 18 },
    { header: "Terakhir Diperbarui", key: "updated", width: 22 },
  ];

  // Header styling
  const prodHeaderRow = prodSheet.getRow(1);
  prodHeaderRow.height = 28;
  prodHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF107C41" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const sampleProducts = [
    ["PRD-DONAT-1", "Donat Klasik Gula Salju", "Donat", 8000, 40, 125],
    ["PRD-DONAT-2", "Donat Bomboloni Nutella Lumer", "Donat", 12000, 25, 94],
    ["PRD-DONAT-3", "Donat Tiramisu Almond Crunch", "Donat", 11000, 30, 78],
    ["PRD-COOKIE-1", "Classic Choco Chip Cookies", "Cookies", 15000, 30, 86],
    ["PRD-COOKIE-2", "Red Velvet Marshmallow Cookies", "Cookies", 18000, 20, 62],
    ["PRD-COOKIE-3", "Matcha White Choco Cookies", "Cookies", 16000, 24, 55],
    ["PRD-PASTRY-1", "Croissant Butter Almond Flaky", "Pastry", 22000, 15, 41],
    ["PRD-DRINK-1", "Iced Creamy Latte Gula Aren", "Minuman", 18000, 50, 110],
  ];

  sampleProducts.forEach((p, idx) => {
    const rowNum = idx + 2;
    const row = prodSheet.addRow({
      id: p[0],
      name: p[1],
      category: p[2],
      price: p[3],
      stock: p[4],
      sold: p[5],
      val: { formula: `D${rowNum}*E${rowNum}` },
      updated: "Hari Ini",
    });

    row.getCell(4).numFmt = '"Rp"#,##0';
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };
    row.getCell(7).numFmt = '"Rp"#,##0';
    row.getCell(7).font = { bold: true, color: { argb: "FF107C41" } };
  });

  // -------------------------------------------------------------
  // SHEET 3: PESANAN & PENJUALAN
  // -------------------------------------------------------------
  const orderSheet = workbook.addWorksheet("Pesanan & Penjualan", {
    properties: { tabColor: { argb: "FF2B579A" } },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  orderSheet.columns = [
    { header: "ID Pesanan", key: "id", width: 16 },
    { header: "Nama Pelanggan", key: "customer", width: 26 },
    { header: "Menu / Produk Dipesan", key: "product", width: 34 },
    { header: "Total Pembayaran (Rp)", key: "total", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Waktu Transaksi", key: "date", width: 20 },
    { header: "Catatan Pembeli", key: "notes", width: 30 },
  ];

  const orderHeaderRow = orderSheet.getRow(1);
  orderHeaderRow.height = 28;
  orderHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B579A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const sampleOrders = [
    ["ORD-101", "Dinda (Bekasi Barat)", "Donat Bomboloni Nutella Lumer (2 pcs)", 24000, "Selesai", "Hari Ini, 08:30", "Gula halus banyakin ya"],
    ["ORD-102", "Bimo (Summarecon Bekasi)", "Red Velvet Marshmallow Cookies (3 pcs)", 54000, "Proses", "Hari Ini, 09:15", "Kirim kurir instan"],
    ["ORD-103", "Kak Sarah (Rawalumbu)", "Box Donat Mix Hemat 6 pcs", 65000, "Selesai", "Hari Ini, 10:00", "Untuk arisan kantor"],
    ["ORD-104", "Mas Reza (Harapan Indah)", "Classic Choco Chip Cookies (2 jar)", 30000, "Selesai", "Kemarin, 14:20", "Packing rapi pakai bubble"],
    ["ORD-105", "Ibu Endang (Galaxy)", "Croissant Butter & Latte", 40000, "Pending", "Kemarin, 16:45", "Menunggu konfirmasi transfer"],
  ];

  sampleOrders.forEach((o) => {
    const row = orderSheet.addRow({
      id: o[0],
      customer: o[1],
      product: o[2],
      total: o[3],
      status: o[4],
      date: o[5],
      notes: o[6],
    });

    row.getCell(4).numFmt = '"Rp"#,##0';
    row.getCell(4).font = { bold: true };
    row.getCell(5).alignment = { horizontal: "center" };
  });

  // -------------------------------------------------------------
  // SHEET 4: ARUS KAS & KEUANGAN
  // -------------------------------------------------------------
  const cashSheet = workbook.addWorksheet("Arus Kas", {
    properties: { tabColor: { argb: "FFD83B01" } },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  cashSheet.columns = [
    { header: "ID Transaksi", key: "id", width: 16 },
    { header: "Keterangan Transaksi", key: "desc", width: 36 },
    { header: "Jenis (in/out)", key: "type", width: 16 },
    { header: "Kategori", key: "category", width: 18 },
    { header: "Nominal (Rp)", key: "amount", width: 18 },
    { header: "Tanggal", key: "date", width: 18 },
  ];

  const cashHeaderRow = cashSheet.getRow(1);
  cashHeaderRow.height = 28;
  cashHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD83B01" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const sampleCash = [
    ["TX-201", "Penjualan ORD-101 (Dinda)", "in", "Penjualan", 24000, "Hari Ini, 08:30"],
    ["TX-202", "Penjualan ORD-103 (Kak Sarah)", "in", "Penjualan", 65000, "Hari Ini, 10:00"],
    ["TX-203", "Beli Tepung Terigu Segitiga Biru & Mentega Anchor", "out", "Bahan Baku", 85000, "Kemarin, 09:00"],
    ["TX-204", "Beli Box Kemasan Donat 50 pcs & Kantong Ramah Lingkungan", "out", "Packaging", 45000, "Kemarin, 11:30"],
    ["TX-205", "Penjualan ORD-104 (Mas Reza)", "in", "Penjualan", 30000, "Kemarin, 14:20"],
    ["TX-206", "Isi Ulang Gas Elpiji 3kg & Listrik", "out", "Operasional", 35000, "Kemarin, 17:00"],
  ];

  sampleCash.forEach((c) => {
    const row = cashSheet.addRow({
      id: c[0],
      desc: c[1],
      type: c[2],
      category: c[3],
      amount: c[4],
      date: c[5],
    });

    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(5).numFmt = '"Rp"#,##0';
    if (c[2] === "in") {
      row.getCell(5).font = { bold: true, color: { argb: "FF107C41" } };
    } else {
      row.getCell(5).font = { bold: true, color: { argb: "FFD83B01" } };
    }
  });

  // Save to root directory and to public folder
  const outputRootPath = path.join(rootDir, "UMKM_Manager_Donat_Cookies.xlsx");
  const outputPublicPath = path.join(rootDir, "public", "UMKM_Manager_Donat_Cookies.xlsx");

  await workbook.xlsx.writeFile(outputRootPath);
  console.log(`Saved Excel spreadsheet to: ${outputRootPath}`);

  if (fs.existsSync(path.join(rootDir, "public"))) {
    await workbook.xlsx.writeFile(outputPublicPath);
    console.log(`Saved Excel spreadsheet to: ${outputPublicPath}`);
  }
}

createUmkmSpreadsheet().catch(console.error);
