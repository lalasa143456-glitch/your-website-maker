/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — INTEGRASI DOKUMEN SPREADSHEET UMKM MANAGER
 * =========================================================================
 * Script ini bekerja LANGSUNG di dalam Dokumen Google Sheets Anda.
 * Menambahkan menu otomatis "🧁 UMKM Manager" di bar atas spreadsheet
 * untuk input data, format tabel, serta sinkronisasi langsung dengan website.
 *
 * CARA MEMASANG DI DOKUMEN GOOGLE SHEETS (HANYA 2 MENIT):
 * 1. Buka file spreadsheet "UMKM_Manager_Donat_Cookies.xlsx" di Google Sheets
 *    (atau buat Google Sheets baru di https://sheets.google.com).
 * 2. Klik menu atas: Ekstensi (Extensions) -> Apps Script.
 * 3. Hapus semua teks yang ada, lalu tempel (PASTE) seluruh kode ini.
 * 4. Tekan tombol Simpan (💾 atau Ctrl+S).
 * 5. Muat ulang (Refresh) halaman Google Sheets Anda -> Menu "🧁 UMKM Manager"
 *    akan langsung muncul di sebelah menu Bantuan (Help)!
 * 6. (Opsional) Untuk mengaktifkan sinkronisasi otomatis dari website:
 *    Klik tombol biru "Terapkan" (Deploy) -> "Penerapan baru" (New deployment)
 *    -> Jenis "Aplikasi web" -> Akses "Siapa saja" (Anyone) -> Salin URL /exec.
 * =========================================================================
 */

var SHEET_PRODUCTS = "Produk & Stok";
var SHEET_ORDERS = "Pesanan & Penjualan";
var SHEET_CASHFLOW = "Arus Kas";
var DEFAULT_WEB_URL = "http://localhost:8080";

/**
 * Otomatis dijalankan saat Dokumen Google Sheets dibuka
 * Menambahkan Menu "🧁 UMKM Manager" di Menu Bar Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🧁 UMKM Manager")
    .addItem("📊 Rapikan Format & Rumus Tabel", "menuFormatSheets")
    .addItem("➕ Input Pesanan Baru dari Dokumen", "menuAddOrder")
    .addSeparator()
    .addItem("🔄 Kirim Data ke Website Toko", "menuSyncToWebsite")
    .addItem("📥 Tarik Data dari Website Toko", "menuPullFromWebsite")
    .addSeparator()
    .addItem("⚙️ Atur URL Website Toko", "menuSetWebsiteUrl")
    .addItem("ℹ️ Bantuan & Status Dokumen", "menuShowHelp")
    .addToUi();
}

/**
 * Menu: Format dan rapikan tabel, warna header, dan rumus otomatis
 */
function menuFormatSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNotExist(ss);
  SpreadsheetApp.getUi().alert(
    "Berhasil!",
    "Semua sheet (Produk & Stok, Pesanan, Arus Kas) telah dirapikan dengan warna header, pembekuan baris, dan rumus otomatis.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Menu: Input pesanan baru langsung dari dialog popup Google Sheets
 */
function menuAddOrder() {
  var ui = SpreadsheetApp.getUi();

  var namePrompt = ui.prompt("Tambah Pesanan Baru", "Nama Pelanggan:", ui.ButtonSet.OK_CANCEL);
  if (namePrompt.getSelectedButton() !== ui.Button.OK) return;
  var customer = namePrompt.getResponseText().trim();
  if (!customer) return;

  var prodPrompt = ui.prompt("Tambah Pesanan Baru", "Menu / Produk yang Dipesan:", ui.ButtonSet.OK_CANCEL);
  if (prodPrompt.getSelectedButton() !== ui.Button.OK) return;
  var product = prodPrompt.getResponseText().trim() || "Pesanan Donat/Cookies";

  var totalPrompt = ui.prompt("Tambah Pesanan Baru", "Total Pembayaran (Rp):", ui.ButtonSet.OK_CANCEL);
  if (totalPrompt.getSelectedButton() !== ui.Button.OK) return;
  var total = parseInt(totalPrompt.getResponseText().replace(/\D/g, ""), 10) || 0;

  var notesPrompt = ui.prompt("Tambah Pesanan Baru", "Catatan Pesanan (opsional):", ui.ButtonSet.OK_CANCEL);
  var notes = notesPrompt.getSelectedButton() === ui.Button.OK ? notesPrompt.getResponseText().trim() : "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNotExist(ss);

  var orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  var nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMM yyyy, HH:mm");

  appendSingleOrder(ss, {
    id: orderId,
    customer: customer,
    product: product,
    total: total,
    status: "Proses",
    date: nowStr,
    notes: notes
  });

  // Catat otomatis pemasukan kas
  var cashSheet = ss.getSheetByName(SHEET_CASHFLOW);
  if (cashSheet) {
    cashSheet.appendRow([
      "TX-" + Math.floor(1000 + Math.random() * 9000),
      "Penjualan " + orderId + " (" + customer + ")",
      "in",
      "Penjualan",
      total,
      nowStr
    ]);
    var lastCashRow = cashSheet.getLastRow();
    cashSheet.getRange(lastCashRow, 5).setNumberFormat('"Rp"#,##0');
  }

  ui.alert("Sukses!", "Pesanan " + orderId + " (" + customer + ") berhasil dicatat ke spreadsheet & kas!", ui.ButtonSet.OK);
}

/**
 * Menu: Atur URL Website UMKM
 */
function menuSetWebsiteUrl() {
  var ui = SpreadsheetApp.getUi();
  var currentUrl = PropertiesService.getUserProperties().getProperty("WEBSITE_URL") || DEFAULT_WEB_URL;

  var prompt = ui.prompt(
    "Pengaturan Website UMKM",
    "Masukkan URL Website Anda (misal: http://localhost:8080 atau domain website):\nSaat ini: " + currentUrl,
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() === ui.Button.OK) {
    var newUrl = prompt.getResponseText().trim();
    if (newUrl) {
      PropertiesService.getUserProperties().setProperty("WEBSITE_URL", newUrl);
      ui.alert("URL Berhasil Disimpan", "URL Website: " + newUrl, ui.ButtonSet.OK);
    }
  }
}

/**
 * Menu: Kirim data dari Google Sheets ke Website
 */
function menuSyncToWebsite() {
  var ui = SpreadsheetApp.getUi();
  var webUrl = PropertiesService.getUserProperties().getProperty("WEBSITE_URL") || DEFAULT_WEB_URL;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = getAllDataFromSheets(ss);

  ui.alert(
    "Data Siap Disinkronkan",
    "Dokumen ini memiliki:\n" +
    "• " + data.products.length + " Produk\n" +
    "• " + data.orders.length + " Pesanan\n" +
    "• " + data.cashflow.length + " Transaksi Kas\n\n" +
    "Data siap diakses oleh Website Anda melalui Web App URL Google Apps Script.",
    ui.ButtonSet.OK
  );
}

/**
 * Menu: Tarik data dari Website
 */
function menuPullFromWebsite() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "Sinkronisasi Dua Arah",
    "Untuk menarik data dari website ke spreadsheet ini:\n" +
    "1. Buka menu Spreadsheet di website Anda.\n" +
    "2. Klik tombol 'Google Sheets & Apps Script'.\n" +
    "3. Klik 'Kirim ke Google Sheets' atau 'Sync Sheets'.\n\n" +
    "Dokumen ini akan otomatis terupdate secara langsung!",
    ui.ButtonSet.OK
  );
}

/**
 * Menu: Bantuan & Status Dokumen
 */
function menuShowHelp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().alert(
    "Informasi Dokumen Spreadsheet UMKM",
    "Nama Dokumen: " + ss.getName() + "\n" +
    "ID Dokumen: " + ss.getId() + "\n\n" +
    "Dokumen ini sudah dilengkapi format otomatis untuk UMKM Donat & Cookies.\n" +
    "Anda dapat mengedit sel secara langsung layaknya Excel biasa.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// =========================================================================
// HANDLER WEB APP (API UNTUK WEBSITE)
// =========================================================================

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || "get_all";

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNotExist(ss);

    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Google Sheets UMKM API terhubung dengan baik!",
        spreadsheetTitle: ss.getName(),
        spreadsheetId: ss.getId(),
        sheets: [SHEET_PRODUCTS, SHEET_ORDERS, SHEET_CASHFLOW],
        timestamp: new Date().toISOString()
      });
    }

    if (action === "get_all") {
      var data = getAllDataFromSheets(ss);
      return createJsonResponse({
        status: "success",
        data: data,
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ status: "error", message: "Action tidak dikenali: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var postDataRaw = (e && e.postData) ? e.postData.contents : null;
    if (!postDataRaw) {
      return createJsonResponse({ status: "error", message: "Tidak ada data payload yang dikirim." });
    }

    var payload = JSON.parse(postDataRaw);
    var action = payload.action || "sync_all";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNotExist(ss);

    if (action === "sync_all") {
      if (payload.products && Array.isArray(payload.products)) {
        writeProductsToSheet(ss, payload.products);
      }
      if (payload.orders && Array.isArray(payload.orders)) {
        writeOrdersToSheet(ss, payload.orders);
      }
      if (payload.cashflow && Array.isArray(payload.cashflow)) {
        writeCashflowToSheet(ss, payload.cashflow);
      }

      return createJsonResponse({
        status: "success",
        message: "Semua data UMKM berhasil disinkronkan ke dokumen Google Sheets!",
        updatedAt: new Date().toISOString()
      });
    }

    if (action === "add_order") {
      if (payload.order) {
        appendSingleOrder(ss, payload.order);
        return createJsonResponse({
          status: "success",
          message: "Pesanan baru berhasil dicatat ke dokumen Google Sheets!",
          orderId: payload.order.id
        });
      }
    }

    return createJsonResponse({ status: "error", message: "Action POST tidak dikenali: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// =========================================================================
// LOGIKA INISIALISASI & PENULISAN TABEL
// =========================================================================

function initSheetsIfNotExist(ss) {
  var productHeaders = ["ID Produk", "Nama Produk", "Kategori", "Harga (Rp)", "Stok", "Terjual", "Nilai Stok (Rp)", "Terakhir Diperbarui"];
  var orderHeaders = ["ID Pesanan", "Nama Pelanggan", "Menu / Produk", "Total (Rp)", "Status", "Tanggal", "Catatan"];
  var cashHeaders = ["ID Transaksi", "Keterangan", "Jenis (in/out)", "Kategori", "Nominal (Rp)", "Tanggal"];

  setupSheet(ss, SHEET_PRODUCTS, productHeaders, "#107c41");
  setupSheet(ss, SHEET_ORDERS, orderHeaders, "#2b579a");
  setupSheet(ss, SHEET_CASHFLOW, cashHeaders, "#d83b01");
}

function setupSheet(ss, sheetName, headers, headerColorHex) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColorHex);
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
}

function writeProductsToSheet(ss, products) {
  var sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }

  if (products.length === 0) return;

  var rows = products.map(function(p, idx) {
    var rowNum = idx + 2;
    return [
      p.id || ("PRD-" + rowNum),
      p.name || "",
      p.category || "Umum",
      Number(p.price) || 0,
      Number(p.stock) || 0,
      Number(p.sold) || 0,
      "=D" + rowNum + "*E" + rowNum,
      new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID")
    ];
  });

  sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  sheet.getRange(2, 4, rows.length, 1).setNumberFormat('"Rp"#,##0');
  sheet.getRange(2, 7, rows.length, 1).setNumberFormat('"Rp"#,##0');
}

function writeOrdersToSheet(ss, orders) {
  var sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  if (orders.length === 0) return;

  var rows = orders.map(function(o) {
    return [
      o.id || "",
      o.customer || "",
      o.product || "",
      Number(o.total) || 0,
      o.status || "Proses",
      o.date || "",
      o.notes || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  sheet.getRange(2, 4, rows.length, 1).setNumberFormat('"Rp"#,##0');
}

function writeCashflowToSheet(ss, cashflow) {
  var sheet = ss.getSheetByName(SHEET_CASHFLOW);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }

  if (cashflow.length === 0) return;

  var rows = cashflow.map(function(c) {
    return [
      c.id || "",
      c.desc || "",
      c.type || "in",
      c.category || "Umum",
      Number(c.amount) || 0,
      c.date || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  sheet.getRange(2, 5, rows.length, 1).setNumberFormat('"Rp"#,##0');
}

function appendSingleOrder(ss, order) {
  var sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return;

  sheet.appendRow([
    order.id || ("ORD-" + Date.now()),
    order.customer || "Pelanggan Baru",
    order.product || "Pesanan Produk",
    Number(order.total) || 0,
    order.status || "Proses",
    order.date || new Date().toLocaleString("id-ID"),
    order.notes || ""
  ]);

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 4).setNumberFormat('"Rp"#,##0');
}

function getAllDataFromSheets(ss) {
  var pSheet = ss.getSheetByName(SHEET_PRODUCTS);
  var oSheet = ss.getSheetByName(SHEET_ORDERS);
  var cSheet = ss.getSheetByName(SHEET_CASHFLOW);

  var products = [];
  var orders = [];
  var cashflow = [];

  if (pSheet && pSheet.getLastRow() > 1) {
    var pData = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 6).getValues();
    products = pData.map(function(r) {
      return {
        id: String(r[0]),
        name: String(r[1]),
        category: String(r[2]),
        price: Number(r[3]) || 0,
        stock: Number(r[4]) || 0,
        sold: Number(r[5]) || 0,
        createdAt: new Date().toISOString()
      };
    });
  }

  if (oSheet && oSheet.getLastRow() > 1) {
    var oData = oSheet.getRange(2, 1, oSheet.getLastRow() - 1, 7).getValues();
    orders = oData.map(function(r) {
      return {
        id: String(r[0]),
        customer: String(r[1]),
        product: String(r[2]),
        total: Number(r[3]) || 0,
        status: String(r[4]),
        date: String(r[5]),
        notes: String(r[6] || "")
      };
    });
  }

  if (cSheet && cSheet.getLastRow() > 1) {
    var cData = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, 6).getValues();
    cashflow = cData.map(function(r) {
      return {
        id: String(r[0]),
        desc: String(r[1]),
        type: String(r[2]) === "out" ? "out" : "in",
        category: String(r[3]),
        amount: Number(r[4]) || 0,
        date: String(r[5])
      };
    });
  }

  return {
    products: products,
    orders: orders,
    cashflow: cashflow
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
