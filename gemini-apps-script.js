/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — ASISTEN GEMINI AI & KNOWLEDGE BASE
 * Untuk Google Sheets: Donat & Cookies Bekasi
 * =========================================================================
 * Fitur:
 * 1. Menu "🤖 Gemini AI" di bar atas Google Sheets untuk:
 *    - Atur / Simpan Gemini API Key secara aman (Script Properties)
 *    - Tes koneksi ke Google Gemini AI
 *    - Tanya jawab langsung via dialog popup
 *    - Buatkan draf pesan balasan WhatsApp untuk pesanan yang dipilih
 * 2. Formula Kustom Google Sheets:
 *    - =TANYA_GEMINI(A2) -> Menjawab pertanyaan seputar produk & toko
 *    - =GEMINI_BALAS_PESAN(nama, pesanan, total) -> Buat draft WA ramah
 *    - =GEMINI_PROMPT("Tulis ide promo jumat berkah...") -> Bebas prompt
 * =========================================================================
 */

// Konfigurasi Default (Bisa juga disimpan via Menu -> "🔑 Atur API Key")
var DEFAULT_GEMINI_API_KEY = ""; // Masukkan API Key di sini ATAU atur via menu Sheets
var GEMINI_MODEL = "gemini-2.5-flash"; // Model cepat, cerdas & hemat biaya

// =========================================================================
// KNOWLEDGE BASE TOKO LENGKAP (Basis Pengetahuan Asisten AI)
// =========================================================================
var STORE_KNOWLEDGE = [
  "IDENTITAS BISNIS:",
  "- Nama Toko: Donat & Cookies Bekasi",
  "- Tagline: Rasa Lembut & Lumer Spesial — Fresh Tiap Pagi",
  "- Deskripsi: Spesialis donat kentang lembut empuk dan artisanal soft-baked cookies rumahan premium di Bekasi. Fresh setiap hari tanpa bahan pengawet.",
  "- Website: https://lalasa.my.id",
  "- Alamat: Bekasi, Jawa Barat, Indonesia",
  "- WhatsApp: 0812-1314-1516 (https://wa.me/6281213141516)",
  "- Instagram: @umkmmanager281",
  "- Jam Buka: Setiap hari pukul 07.00 - 20.00 WIB",
  "- Pengiriman: Kurir Instan / Sameday (GoSend / GrabExpress) se-Bekasi",
  "",
  "KATALOG MENU & HARGA:",
  "1. Donat Klasik Gula Salju (PRD-001): Rp 8.000 / pcs (Donat kentang empuk tradisional dengan taburan gula salju dingin)",
  "2. Donat Bomboloni Nutella Lumer (PRD-002) [BEST SELLER]: Rp 12.000 / pcs (Donat montok isi Nutella asli melimpah yang lumer)",
  "3. Donat Tiramisu Almond Crunch (PRD-003): Rp 11.000 / pcs (Donat glaze tiramisu wangi berpadu kacang almond panggang)",
  "4. Classic Choco Chip Cookies (PRD-004): Rp 15.000 / pcs (Soft-baked cookies kenyal di dalam dengan limpahan chocolate chips)",
  "5. Red Velvet Marshmallow Cookies (PRD-005): Rp 18.000 / pcs (Cookies red velvet mewah dengan melted marshmallow di tengah)",
  "6. Matcha White Choco Cookies (PRD-006): Rp 16.000 / pcs (Matcha Jepang asli dengan lelehan cokelat putih Belgia)",
  "",
  "PAKET KHUSUS & PROMO:",
  "- Box Donat Isi 6: Hemat Rp 2.000",
  "- Box Donat Isi 12: Bonus 1 pcs Donat Klasik Gula Salju",
  "- Jar Hampers Soft Cookies: Kemasan toples cantik untuk kado/hampers",
  "",
  "DAYA SIMPAN & CARA KONSUMSI:",
  "- Donat: Tahan 1-2 hari di suhu ruang dalam wadah tertutup rapat. Paling enak hari ke-1.",
  "- Cookies: Tahan 7 hari di suhu ruang, 14 hari di dalam kulkas. Hangatkan 10-15 detik di microwave agar cokelat kembali lumer.",
  "",
  "CARA PEMESANAN & PEMBAYARAN:",
  "- Pemesanan via Website: https://lalasa.my.id/#pesan",
  "- Pemesanan via WhatsApp: 0812-1314-1516",
  "- Pembayaran: Transfer Bank (BCA, Mandiri, BRI) atau QRIS",
  "",
  "PERSONA & GAYA BAHASA ASISTEN:",
  "- Sapa pelanggan dengan panggilan sopan dan ramah seperti 'Kak' atau 'Kakak'.",
  "- Berikan rekomendasi produk terbaik dan hitungkan perkiraan total harga jika pelanggan menyebutkan pesanannya.",
  "- Arahkan pelanggan untuk konfirmasi pemesanan ke link web https://lalasa.my.id atau WhatsApp 081213141516."
].join("\n");

// =========================================================================
// MENU GOOGLE SHEETS
// =========================================================================

/**
 * Menambahkan menu "🤖 Gemini AI" di menu bar atas Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🤖 Gemini AI")
    .addItem("💬 Tanya Asisten Gemini", "menuAskGemini")
    .addItem("✍️ Buat Draf Balasan WA (Baris Aktif)", "menuDraftWhatsAppReply")
    .addSeparator()
    .addItem("🧪 Tes Koneksi Gemini API", "menuTestGeminiConnection")
    .addItem("🔑 Atur / Ubah Gemini API Key", "menuSetApiKey")
    .addItem("ℹ️ Informasi & Cara Pakai Rumus", "menuShowInfo")
    .addToUi();
}

/**
 * Mengambil API Key dari Script Properties (atau DEFAULT_GEMINI_API_KEY)
 */
function getGeminiApiKey() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty("GEMINI_API_KEY");
  if (key && key.trim() !== "") {
    return key.trim();
  }
  if (DEFAULT_GEMINI_API_KEY && DEFAULT_GEMINI_API_KEY.trim() !== "") {
    return DEFAULT_GEMINI_API_KEY.trim();
  }
  return null;
}

/**
 * Dialog untuk mengatur Gemini API Key
 */
function menuSetApiKey() {
  var ui = SpreadsheetApp.getUi();
  var currentKey = getGeminiApiKey() || "";
  var maskedKey = currentKey ? currentKey.substring(0, 6) + "..." + currentKey.slice(-4) : "Belum diatur";

  var response = ui.prompt(
    "Pengaturan Gemini API Key",
    "API Key saat ini: " + maskedKey + "\n\n" +
    "Dapatkan API Key gratis di: https://aistudio.google.com/app/apikey\n\n" +
    "Masukkan Gemini API Key baru Anda:",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var newKey = response.getResponseText().trim();
    if (newKey) {
      PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", newKey);
      ui.alert("Berhasil!", "Gemini API Key telah disimpan dengan aman di Script Properties.", ui.ButtonSet.OK);
    } else {
      ui.alert("Peringatan", "API Key tidak boleh kosong.", ui.ButtonSet.OK);
    }
  }
}

/**
 * Menguji koneksi Gemini API
 */
function menuTestGeminiConnection() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = getGeminiApiKey();

  if (!apiKey) {
    ui.alert(
      "API Key Belum Diatur",
      "Silakan klik menu '🤖 Gemini AI' -> '🔑 Atur / Ubah Gemini API Key' dan masukkan API key Anda.",
      ui.ButtonSet.OK
    );
    return;
  }

  ui.alert("Menghubungi Gemini...", "Sedang menguji koneksi ke Google Gemini AI, mohon tunggu sebentar...", ui.ButtonSet.OK);

  try {
    var reply = callGeminiRaw("Katakan 'Koneksi Gemini AI Sukses! Siap melayani Toko Donat & Cookies Bekasi.' dalam 1 kalimat ceria.");
    ui.alert("Koneksi Sukses! 🎉", reply, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Gagal Terhubung ❌", "Error: " + err.message, ui.ButtonSet.OK);
  }
}

/**
 * Dialog Tanya Jawab langsung dengan Gemini
 */
function menuAskGemini() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt(
    "💬 Tanya Asisten Donat & Cookies",
    "Contoh: 'Kak, donat bomboloni tahan berapa hari?' atau 'Tuliskan ide caption IG untuk promo jumat'\n\nMasukkan pertanyaan:",
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() === ui.Button.OK) {
    var prompt = promptRes.getResponseText().trim();
    if (!prompt) return;

    try {
      var answer = TANYA_GEMINI(prompt);
      ui.alert("Jawaban Asisten Gemini 🤖", answer, ui.ButtonSet.OK);
    } catch (e) {
      ui.alert("Error", e.message, ui.ButtonSet.OK);
    }
  }
}

/**
 * Buatkan pesan draf balasan WhatsApp otomatis dari baris pesanan yang sedang dipilih
 */
function menuDraftWhatsAppReply() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveCell().getRow();

  if (row <= 1) {
    ui.alert("Pilih Baris Pesanan", "Harap klik salah satu baris data pesanan pelanggan di tabel terlebih dahulu.", ui.ButtonSet.OK);
    return;
  }

  var rowValues = sheet.getRange(row, 1, 1, 8).getValues()[0];
  var custName = rowValues[1] || "Pelanggan";
  var prodName = rowValues[2] || "Pesanan Donat / Cookies";
  var totalNominal = rowValues[4] ? "Rp " + Number(rowValues[4]).toLocaleString("id-ID") : "Sesuai Nota";

  var prompt = "Buatkan draf balasan chat WhatsApp yang ramah dan antusias untuk mengonfirmasi pesanan pelanggan.\n" +
               "Nama: " + custName + "\n" +
               "Pesanan: " + prodName + "\n" +
               "Total: " + totalNominal + "\n" +
               "Sertakan nomor rekening BCA 1234567890 an Donat Cookies Bekasi atau info QRIS, dan mintakan bukti transfer.";

  try {
    var reply = callGeminiApi(prompt, STORE_KNOWLEDGE);
    ui.alert("Draf Pesan WhatsApp untuk " + custName + " 📲", reply, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Error", err.message, ui.ButtonSet.OK);
  }
}

/**
 * Menampilkan panduan formula spreadsheet
 */
function menuShowInfo() {
  var ui = SpreadsheetApp.getUi();
  var info = 
    "RUMUS FORMULA GEMINI DI SPREADSHEET:\n\n" +
    "1. =TANYA_GEMINI(sel_pertanyaan)\n" +
    "   Contoh: =TANYA_GEMINI(A2)\n" +
    "   Menjawab pertanyaan seputar menu, harga, daya simpan berdasarkan profil toko.\n\n" +
    "2. =GEMINI_BALAS_PESAN(nama, pesanan, total)\n" +
    "   Contoh: =GEMINI_BALAS_PESAN(B2, C2, E2)\n" +
    "   Otomatis membuat kalimat chat balasan konfirmasi pesanan.\n\n" +
    "3. =GEMINI_PROMPT(isi_prompt)\n" +
    "   Contoh: =GEMINI_PROMPT(\"Buatkan 3 ide promo akhir bulan\")\n" +
    "   Menjalankan prompt umum tanpa batasan.";

  ui.alert("Panduan Penggunaan Formula Gemini 🤖", info, ui.ButtonSet.OK);
}

// =========================================================================
// FUNGSI CUSTOM FORMULA GOOGLE SHEETS
// =========================================================================

/**
 * Menjawab pertanyaan seputar produk & toko menggunakan Knowledge Base
 * @param {string} prompt Pertanyaan (misal: "Berapa harga bomboloni?")
 * @return {string} Jawaban dari Gemini AI
 * @customfunction
 */
function TANYA_GEMINI(prompt) {
  if (!prompt) return "Masukkan pertanyaan ke dalam rumus.";
  try {
    return callGeminiApi(String(prompt), STORE_KNOWLEDGE);
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * Membuat draf pesan balasan WhatsApp konfirmasi pesanan
 * @param {string} nama Nama pelanggan
 * @param {string} pesanan Nama produk yang dipesan
 * @param {number|string} total Total pembayaran
 * @return {string} Draf pesan ramah siap kirim ke WhatsApp
 * @customfunction
 */
function GEMINI_BALAS_PESAN(nama, pesanan, total) {
  if (!nama || !pesanan) return "Harap lengkapi nama dan pesanan.";
  var prompt = "Buatkan draf balasan WhatsApp singkat, ramah, dan sopan untuk pelanggan dengan rincian:\n" +
               "- Nama: " + nama + "\n" +
               "- Pesanan: " + pesanan + "\n" +
               "- Total Tagihan: " + total + "\n" +
               "Minta pelanggan mengirimkan bukti transfer jika sudah melakukan pembayaran.";
  try {
    return callGeminiApi(prompt, STORE_KNOWLEDGE);
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * Memanggil Gemini AI dengan prompt bebas
 * @param {string} prompt Perintah bebas
 * @return {string} Hasil respon Gemini
 * @customfunction
 */
function GEMINI_PROMPT(prompt) {
  if (!prompt) return "Harap masukkan prompt.";
  try {
    return callGeminiRaw(String(prompt));
  } catch (e) {
    return "Error: " + e.message;
  }
}

// =========================================================================
// CORE ENGINE: HTTP REQUEST KE GOOGLE GEMINI REST API
// =========================================================================

/**
 * Panggilan inti ke Gemini API dengan System Instruction / Knowledge Base
 */
function callGeminiApi(userPrompt, systemInstruction) {
  var apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key belum diatur. Buka menu '🤖 Gemini AI' -> '🔑 Atur / Ubah Gemini API Key'.");
  }

  var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + encodeURIComponent(apiKey);

  var payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(endpoint, options);
  var code = response.getResponseCode();
  var responseText = response.getContentText();
  var json = JSON.parse(responseText);

  if (code !== 200) {
    var errMsg = (json.error && json.error.message) ? json.error.message : responseText;
    throw new Error("Gemini API [" + code + "]: " + errMsg);
  }

  if (json.candidates && json.candidates.length > 0 &&
      json.candidates[0].content &&
      json.candidates[0].content.parts &&
      json.candidates[0].content.parts.length > 0) {
    return json.candidates[0].content.parts[0].text.trim();
  }

  return "Tidak ada respon teks dari Gemini.";
}

/**
 * Panggilan Gemini sederhana tanpa system instruction
 */
function callGeminiRaw(userPrompt) {
  return callGeminiApi(userPrompt, null);
}
