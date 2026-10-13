import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const rootDir = process.cwd();
const excelFilePath = path.resolve(rootDir, "UMKM_Manager_Donat_Cookies.xlsx");
const publicExcelPath = path.resolve(rootDir, "public", "UMKM_Manager_Donat_Cookies.xlsx");

interface OrderPayload {
  id: string;
  customer: string;
  product: string;
  total: number;
  date?: string;
  status?: string;
  notes?: string;
}

interface SyncPayload {
  products?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    sold?: number;
  }>;
  orders?: OrderPayload[];
  cashflow?: Array<{
    id: string;
    desc: string;
    type: "in" | "out";
    amount: number;
    date: string;
    category: string;
  }>;
}

export function spreadsheetSyncPlugin(): Plugin {
  return {
    name: "vite-plugin-umkm-spreadsheet-sync",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";

        if (!url.startsWith("/api/spreadsheet/")) {
          return next();
        }

        // Set CORS & JSON headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const endpoint = (url.split("?")[0] || "").replace("/api/spreadsheet/", "");

        try {
          if (endpoint === "status" && req.method === "GET") {
            const exists = fs.existsSync(excelFilePath);
            let stats = null;
            if (exists) {
              const fileStat = fs.statSync(excelFilePath);
              stats = {
                size: fileStat.size,
                lastModified: fileStat.mtime.toISOString(),
                filePath: excelFilePath,
              };
            }
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                exists,
                stats,
                connected: true,
              })
            );
            return;
          }

          if (endpoint === "append-order" && req.method === "POST") {
            const body = await parseJsonBody<OrderPayload>(req);
            if (!body || !body.id) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: "Order data invalid" }));
              return;
            }

            const workbook = new ExcelJS.Workbook();
            if (fs.existsSync(excelFilePath)) {
              await workbook.xlsx.readFile(excelFilePath);
            }

            let orderSheet = workbook.getWorksheet("Pesanan & Penjualan");
            if (!orderSheet) {
              orderSheet = workbook.addWorksheet("Pesanan & Penjualan");
              orderSheet.addRow(["ID Pesanan", "Tanggal & Waktu", "Nama Pelanggan", "Pesanan Item", "Total Belanja (Rp)", "Status", "Channel", "Catatan"]);
            }

            const nowStr = body.date || new Date().toLocaleString("id-ID");
            const newRow = orderSheet.addRow([
              body.id,
              nowStr,
              body.customer || "Pelanggan Toko",
              body.product || "-",
              body.total || 0,
              body.status || "Proses",
              "Website",
              body.notes || "-",
            ]);

            // Format Rupiah pada kolom Total
            newRow.getCell(5).numFmt = '"Rp"#,##0';
            newRow.commit();

            // Tambahkan juga ke Arus Kas
            let cashSheet = workbook.getWorksheet("Arus Kas");
            if (cashSheet) {
              const cashRow = cashSheet.addRow([
                `CASH-${body.id}`,
                nowStr,
                "in",
                `Penjualan ${body.id} (${body.customer})`,
                body.total || 0,
                "Penjualan Website",
              ]);
              cashRow.getCell(5).numFmt = '"Rp"#,##0';
              cashRow.commit();
            }

            // Simpan workbook ke disk & folder public
            await workbook.xlsx.writeFile(excelFilePath);
            try {
              fs.copyFileSync(excelFilePath, publicExcelPath);
            } catch {}

            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                message: `Pesanan ${body.id} berhasil ditambahkan ke dokumen spreadsheet`,
                filePath: excelFilePath,
              })
            );
            return;
          }

          if (endpoint === "sync-all" && req.method === "POST") {
            const payload = await parseJsonBody<SyncPayload>(req);
            const workbook = new ExcelJS.Workbook();
            if (fs.existsSync(excelFilePath)) {
              await workbook.xlsx.readFile(excelFilePath);
            }

            // Sync sheet Produk jika ada
            if (payload.products && payload.products.length > 0) {
              let prodSheet = workbook.getWorksheet("Produk & Stok");
              if (prodSheet) {
                // Clear rows after header
                while (prodSheet.rowCount > 1) {
                  prodSheet.spliceRows(2, 1);
                }
                payload.products.forEach((p) => {
                  const hpp = Math.round(p.price * 0.6);
                  const row = prodSheet.addRow([
                    p.id,
                    p.name,
                    p.category,
                    p.price,
                    hpp,
                    p.stock,
                    { formula: `D${prodSheet.rowCount}*F${prodSheet.rowCount}` },
                    p.stock > 10 ? "Tersedia" : p.stock > 0 ? "Menipis" : "Habis",
                  ]);
                  row.getCell(4).numFmt = '"Rp"#,##0';
                  row.getCell(5).numFmt = '"Rp"#,##0';
                  row.getCell(7).numFmt = '"Rp"#,##0';
                });
              }
            }

            // Simpan workbook
            await workbook.xlsx.writeFile(excelFilePath);
            try {
              fs.copyFileSync(excelFilePath, publicExcelPath);
            } catch {}

            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, message: "Sinkronisasi dokumen spreadsheet selesai" }));
            return;
          }

          next();
        } catch (error: any) {
          console.error("Spreadsheet sync middleware error:", error);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error?.message || "Internal error" }));
        }
      });
    },
  };
}

function parseJsonBody<T>(req: any): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
