import { Product, Order, CashTransaction } from "./database";

const DEFAULT_GAS_URL =
  (import.meta.env["VITE_GOOGLE_APPS_SCRIPT_URL"] as string) ||
  "https://script.google.com/macros/s/AKfycbyZh6AAHsau1DJS5w3XOJiSCdVIZ3vrCkju2pFa7b733Qpd_Ocp6X78zx6LyzGyOFdG/exec";
const DEFAULT_DOC_URL =
  (import.meta.env["VITE_GOOGLE_SHEET_DOC_URL"] as string) ||
  "https://docs.google.com/spreadsheets/d/17B2bqrxO5N7HtJ6OUUJgvqlDvqCW9hI5JJT0y3Ifduo/edit";
const GAS_URL_STORAGE_KEY = "umkm_google_sheets_url";
const GOOGLE_DOC_URL_STORAGE_KEY = "umkm_google_sheet_doc_url";

export const googleSheets = {
  getUrl(): string {
    if (typeof window === "undefined") return DEFAULT_GAS_URL;
    return localStorage.getItem(GAS_URL_STORAGE_KEY) || DEFAULT_GAS_URL;
  },

  setUrl(url: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
  },

  getDocUrl(): string {
    if (typeof window === "undefined") return DEFAULT_DOC_URL;
    return localStorage.getItem(GOOGLE_DOC_URL_STORAGE_KEY) || DEFAULT_DOC_URL;
  },

  setDocUrl(url: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(GOOGLE_DOC_URL_STORAGE_KEY, url.trim());
  },

  isConfigured(): boolean {
    const url = this.getUrl();
    return Boolean(url && url.startsWith("https://script.google.com/macros/s/"));
  },

  hasDocUrl(): boolean {
    const docUrl = this.getDocUrl();
    return Boolean(docUrl && docUrl.includes("docs.google.com/spreadsheets"));
  },

  clearAll(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GAS_URL_STORAGE_KEY);
    localStorage.removeItem(GOOGLE_DOC_URL_STORAGE_KEY);
  },

  /**
   * Test koneksi ke Google Apps Script Web App
   */
  async testConnection(): Promise<{ success: boolean; message: string; title?: string }> {
    const url = this.getUrl();
    if (!url) {
      return { success: false, message: "URL Google Apps Script belum diisi." };
    }

    try {
      const pingUrl = `${url}${url.includes("?") ? "&" : "?"}action=ping&t=${Date.now()}`;
      const response = await fetch(pingUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server merespon dengan status ${response.status} (${response.statusText})`,
        };
      }

      const data = await response.json();
      if (data.status === "success") {
        return {
          success: true,
          message: data.message || "Berhasil terhubung ke Google Sheets!",
          title: data.spreadsheetTitle,
        };
      }
      return {
        success: false,
        message: data.message || "Respon dari Google Sheets tidak valid.",
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${errMsg}. Pastikan izin deployment diatur ke 'Anyone' (Siapa saja).`,
      };
    }
  },

  /**
   * Kirim seluruh data (Produk, Pesanan, Arus Kas) ke Google Sheets
   */
  async syncAllToSheets(payload: {
    products: Product[];
    orders: Order[];
    cashflow: CashTransaction[];
  }): Promise<{ success: boolean; message: string }> {
    const url = this.getUrl();
    if (!url) {
      return { success: false, message: "URL Google Apps Script belum diatur." };
    }

    try {
      const bodyData = JSON.stringify({
        action: "sync_all",
        products: payload.products,
        orders: payload.orders,
        cashflow: payload.cashflow,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: bodyData,
      });

      const result = await response.json();
      if (result.status === "success") {
        return {
          success: true,
          message: result.message || "Data berhasil disinkronkan ke Google Sheets!",
        };
      }
      return {
        success: false,
        message: result.message || "Gagal menyimpan ke Google Sheets.",
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Koneksi gagal: ${errMsg}`,
      };
    }
  },

  /**
   * Tarik data dari Google Sheets ke Aplikasi Web
   */
  async fetchAllFromSheets(): Promise<{
    success: boolean;
    data?: { products: Product[]; orders: Order[]; cashflow: CashTransaction[] };
    message?: string;
  }> {
    const url = this.getUrl();
    if (!url) {
      return { success: false, message: "URL Google Apps Script belum diatur." };
    }

    try {
      const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}action=get_all&t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const res = await response.json();
      if (res.status === "success" && res.data) {
        return {
          success: true,
          data: res.data,
        };
      }
      return {
        success: false,
        message: res.message || "Format data tidak sesuai.",
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Gagal menarik data: ${errMsg}`,
      };
    }
  },

  /**
   * Menambahkan satu pesanan langsung ke Google Sheets (Background)
   */
  async appendOrder(order: Order): Promise<void> {
    const url = this.getUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "add_order",
          order: order,
        }),
      });
    } catch (err) {
      console.warn("Gagal append order ke Google Sheets:", err);
    }
  },
};

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — INTEGRASI DOKUMEN SPREADSHEET UMKM MANAGER
 * =========================================================================
 * Script ini bekerja LANGSUNG di dalam Dokumen Google Sheets Anda.
 * Menambahkan menu otomatis "🧁 UMKM Manager" di bar atas spreadsheet
 * untuk input data, format tabel, serta sinkronisasi langsung dengan website.
 */

var SHEET_PRODUCTS = "Produk & Stok";
var SHEET_ORDERS = "Pesanan & Penjualan";
var SHEET_CASHFLOW = "Arus Kas";
var DEFAULT_WEB_URL = "http://localhost:8080";

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

function menuFormatSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNotExist(ss);
  SpreadsheetApp.getUi().alert(
    "Berhasil!",
    "Semua sheet telah dirapikan dengan warna header, pembekuan baris, dan rumus otomatis.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

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
  var total = parseInt(totalPrompt.getResponseText().replace(/\\D/g, ""), 10) || 0;

  var notesPrompt = ui.prompt("Tambah Pesanan Baru", "Catatan Pesanan (opsional):", ui.ButtonSet.OK_CANCEL);
  var notes = notesPrompt.getSelectedButton() === ui.Button.OK ? notesPrompt.getResponseText().trim() : "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNotExist(ss);

  var orderSheet = ss.getSheetByName(SHEET_ORDERS);
  var nextOrderNum = orderSheet && orderSheet.getLastRow() >= 1 ? orderSheet.getLastRow() : 1;
  var orderId = "ORD-" + ("000" + nextOrderNum).slice(-3);
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

  var cashSheet = ss.getSheetByName(SHEET_CASHFLOW);
  if (cashSheet) {
    var nextCashNum = cashSheet.getLastRow() >= 1 ? cashSheet.getLastRow() : 1;
    var cashId = "TX-" + ("000" + nextCashNum).slice(-3);
    cashSheet.appendRow([
      cashId,
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

function menuSetWebsiteUrl() {
  var ui = SpreadsheetApp.getUi();
  var currentUrl = PropertiesService.getUserProperties().getProperty("WEBSITE_URL") || DEFAULT_WEB_URL;
  var prompt = ui.prompt("Pengaturan Website UMKM", "Masukkan URL Website:\\nSaat ini: " + currentUrl, ui.ButtonSet.OK_CANCEL);
  if (prompt.getSelectedButton() === ui.Button.OK) {
    var newUrl = prompt.getResponseText().trim();
    if (newUrl) {
      PropertiesService.getUserProperties().setProperty("WEBSITE_URL", newUrl);
      ui.alert("Tersimpan", "URL Website: " + newUrl, ui.ButtonSet.OK);
    }
  }
}

function menuSyncToWebsite() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = getAllDataFromSheets(ss);
  ui.alert("Data Siap Disinkronkan", "Dokumen ini memiliki " + data.products.length + " Produk, " + data.orders.length + " Pesanan, dan " + data.cashflow.length + " Kas. Siap diakses oleh website.", ui.ButtonSet.OK);
}

function menuPullFromWebsite() {
  var ui = SpreadsheetApp.getUi();
  ui.alert("Sinkronisasi", "Buka menu Spreadsheet di website Anda -> klik 'Google Sheets' -> 'Kirim ke Google Sheets'. Data akan otomatis terupdate di sini!", ui.ButtonSet.OK);
}

function menuShowHelp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().alert("Info Dokumen UMKM", "Nama Dokumen: " + ss.getName() + "\\nID: " + ss.getId(), SpreadsheetApp.getUi().ButtonSet.OK);
}

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
      if (payload.products && Array.isArray(payload.products)) writeProductsToSheet(ss, payload.products);
      if (payload.orders && Array.isArray(payload.orders)) writeOrdersToSheet(ss, payload.orders);
      if (payload.cashflow && Array.isArray(payload.cashflow)) writeCashflowToSheet(ss, payload.cashflow);

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
  if (!sheet) sheet = ss.insertSheet(sheetName);

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
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  if (products.length === 0) return;

  var rows = products.map(function(p, idx) {
    var rowNum = idx + 2;
    return [
      p.id || ("PRD-" + ("000" + (idx + 1)).slice(-3)),
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
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  if (orders.length === 0) return;

  var rows = orders.map(function(o, idx) {
    return [
      o.id || ("ORD-" + ("000" + (idx + 1)).slice(-3)),
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
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  if (cashflow.length === 0) return;

  var rows = cashflow.map(function(c, idx) {
    return [
      c.id || ("TX-" + ("000" + (idx + 1)).slice(-3)),
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
  var nextNum = sheet.getLastRow() >= 1 ? sheet.getLastRow() : 1;
  var fallbackId = "ORD-" + ("000" + nextNum).slice(-3);
  sheet.appendRow([
    order.id || fallbackId,
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

  return { products: products, orders: orders, cashflow: cashflow };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
