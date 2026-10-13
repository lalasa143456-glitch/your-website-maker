import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Search,
  Calculator,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Table as TableIcon,
  Package,
  ShoppingCart,
  Wallet,
  Sparkles,
  Copy,
  ChevronDown,
  Share2,
  ExternalLink,
  Check,
  RefreshCw,
  Code2,
} from "lucide-react";
import { db, Product, Order, CashTransaction, getNextSequentialId } from "@/lib/database";
import { googleSheets, GOOGLE_APPS_SCRIPT_CODE } from "@/lib/googleSheets";

export type SheetType = "products" | "orders" | "cashflow" | "custom";

interface ColumnDef {
  id: string;
  letter: string;
  header: string;
  field: string;
  width?: string;
  type?: "text" | "number" | "currency" | "select" | "date";
  options?: string[];
  readOnly?: boolean;
}

export function SpreadsheetView({
  initialSheet = "orders",
  onDataChanged,
}: {
  initialSheet?: SheetType;
  onDataChanged?: () => void;
}) {
  const [activeSheet, setActiveSheet] = useState<SheetType>("orders");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({
    row: 0,
    col: 1,
  });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<{ col: number; direction: "asc" | "desc" } | null>(
    null,
  );
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Google Sheets & Apps Script Integration States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleTab, setGoogleTab] = useState<"setup" | "connect">("setup");
  const [gasUrl, setGasUrl] = useState(() => googleSheets.getUrl());
  const [docUrl, setDocUrl] = useState(() => googleSheets.getDocUrl());
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [isSyncingGas, setIsSyncingGas] = useState(false);
  const [gasConnectedTitle, setGasConnectedTitle] = useState<string | null>(null);
  const [gasCopyCopied, setGasCopyCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sheet Data States
  const [productRows, setProductRows] = useState<string[][]>([]);
  const [orderRows, setOrderRows] = useState<string[][]>([]);
  const [cashflowRows, setCashflowRows] = useState<string[][]>([]);
  const [customRows, setCustomRows] = useState<string[][]>([]);

  // Quick summary calculations for orders
  const totalOrderOmzet = useMemo(() => {
    return orderRows.reduce((acc, r) => {
      const val = evaluateCell(r[3] || "0", orderRows).display;
      const num = parseFloat(val.replace(/[^0-9.-]/g, "")) || 0;
      return acc + num;
    }, 0);
  }, [orderRows]);

  const orderCountSelesai = useMemo(() => {
    return orderRows.filter((r) => r[4] === "Selesai").length;
  }, [orderRows]);

  const orderCountProses = useMemo(() => {
    return orderRows.filter((r) => r[4] === "Proses" || r[4] === "Pending").length;
  }, [orderRows]);

  // Column Definitions for each sheet
  const productCols: ColumnDef[] = [
    { id: "id", letter: "A", header: "ID Produk", field: "id", width: "130px", readOnly: true },
    { id: "name", letter: "B", header: "Nama Produk", field: "name", width: "240px", type: "text" },
    {
      id: "category",
      letter: "C",
      header: "Kategori",
      field: "category",
      width: "140px",
      type: "select",
      options: ["Donat", "Cookies", "Pastry", "Kue & Roti", "Minuman", "Umum"],
    },
    { id: "price", letter: "D", header: "Harga (Rp)", field: "price", width: "130px", type: "currency" },
    { id: "stock", letter: "E", header: "Stok", field: "stock", width: "100px", type: "number" },
    { id: "sold", letter: "F", header: "Terjual", field: "sold", width: "100px", type: "number" },
    {
      id: "val",
      letter: "G",
      header: "Nilai Stok (Rp)",
      field: "val",
      width: "150px",
      type: "currency",
      readOnly: false,
    },
  ];

  const orderCols: ColumnDef[] = [
    { id: "id", letter: "A", header: "ID Pesanan", field: "id", width: "120px", readOnly: true },
    { id: "customer", letter: "B", header: "Nama Pembeli", field: "customer", width: "220px", type: "text" },
    { id: "product", letter: "C", header: "Menu / Produk", field: "product", width: "240px", type: "text" },
    { id: "total", letter: "D", header: "Total (Rp)", field: "total", width: "140px", type: "currency" },
    {
      id: "status",
      letter: "E",
      header: "Status",
      field: "status",
      width: "130px",
      type: "select",
      options: ["Selesai", "Proses", "Pending", "Dibatalkan"],
    },
    { id: "date", letter: "F", header: "Tanggal", field: "date", width: "150px", type: "text" },
    { id: "notes", letter: "G", header: "Catatan Pembeli", field: "notes", width: "220px", type: "text" },
  ];

  const cashflowCols: ColumnDef[] = [
    { id: "id", letter: "A", header: "ID Transaksi", field: "id", width: "120px", readOnly: true },
    { id: "desc", letter: "B", header: "Keterangan", field: "desc", width: "260px", type: "text" },
    {
      id: "type",
      letter: "C",
      header: "Jenis",
      field: "type",
      width: "130px",
      type: "select",
      options: ["in", "out"],
    },
    { id: "category", letter: "D", header: "Kategori", field: "category", width: "150px", type: "text" },
    { id: "amount", letter: "E", header: "Nominal (Rp)", field: "amount", width: "140px", type: "currency" },
    { id: "date", letter: "F", header: "Tanggal", field: "date", width: "150px", type: "text" },
  ];

  const customCols: ColumnDef[] = useMemo(() => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    return letters.map((l, i) => ({
      id: `col_${i}`,
      letter: l,
      header: `Kolom ${l}`,
      field: `col_${i}`,
      width: "150px",
      type: "text",
    }));
  }, []);

  // Determine current active columns
  const activeCols = useMemo(() => {
    switch (activeSheet) {
      case "products":
        return productCols;
      case "orders":
        return orderCols;
      case "cashflow":
        return cashflowCols;
      case "custom":
        return customCols;
    }
  }, [activeSheet]);

  // Determine current active rows
  const activeRows = useMemo(() => {
    switch (activeSheet) {
      case "products":
        return productRows;
      case "orders":
        return orderRows;
      case "cashflow":
        return cashflowRows;
      case "custom":
        return customRows;
    }
  }, [activeSheet, productRows, orderRows, cashflowRows, customRows]);

  // Setter for active rows
  const setActiveRows = (newRows: string[][]) => {
    setHasUnsavedChanges(true);
    switch (activeSheet) {
      case "products":
        setProductRows(newRows);
        break;
      case "orders":
        setOrderRows(newRows);
        break;
      case "cashflow":
        setCashflowRows(newRows);
        break;
      case "custom":
        setCustomRows(newRows);
        break;
    }
  };

  // Load Initial Data from DB
  const loadFromDatabase = () => {
    const prods = db.getProducts();
    const orders = db.getOrders();
    const cash = db.getCashflow();

    // Map Products
    const pRows = prods.map((p) => [
      p.id,
      p.name,
      p.category,
      String(p.price),
      String(p.stock),
      String(p.sold),
      `=D${prods.indexOf(p) + 2}*E${prods.indexOf(p) + 2}`, // Auto formula Nilai Stok = Harga * Stok
    ]);
    setProductRows(pRows.length ? pRows : [["PRD-001", "Contoh Produk Baru", "Donat", "10000", "20", "0", "=D2*E2"]]);

    // Map Orders
    const oRows = orders.map((o) => [
      o.id,
      o.customer,
      o.product,
      String(o.total),
      o.status,
      o.date,
      o.notes || "",
    ]);
    setOrderRows(oRows);

    // Map Cashflow
    const cRows = cash.map((c) => [
      c.id,
      c.desc,
      c.type,
      c.category,
      String(c.amount),
      c.date,
    ]);
    setCashflowRows(cRows.length ? cRows : [["TX-001", "Modal Kas Awal", "in", "Modal", "200000", "Hari Ini"]]);

    // Initialize custom sheet if empty
    if (customRows.length === 0) {
      const initCustom: string[][] = [];
      for (let r = 0; r < 12; r++) {
        initCustom.push(Array(10).fill(""));
      }
      initCustom[0] = ["Rencana Anggaran", "Target", "Realisasi", "Selisih", "", "", "", "", "", ""];
      initCustom[1] = ["Bahan Donat", "500000", "450000", "=B2-C2", "", "", "", "", "", ""];
      initCustom[2] = ["Kemasan Box", "200000", "210000", "=B3-C3", "", "", "", "", "", ""];
      initCustom[3] = ["Gas & Listrik", "150000", "140000", "=B4-C4", "", "", "", "", "", ""];
      initCustom[4] = ["TOTAL", "=SUM(B2:B4)", "=SUM(C2:C4)", "=B5-C5", "", "", "", "", "", ""];
      setCustomRows(initCustom);
    }

    setHasUnsavedChanges(false);
    showNotice("Data berhasil dimuat dari database toko.");
  };

  useEffect(() => {
    loadFromDatabase();
  }, []);

  const showNotice = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Google Sheets integration handlers
  const handleCopyGasCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    }
    setGasCopyCopied(true);
    showNotice("Kode Google Apps Script berhasil disalin ke clipboard!");
    setTimeout(() => setGasCopyCopied(false), 3000);
  };

  const handleTestGasConnection = async () => {
    if (!gasUrl.trim()) {
      alert("Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.");
      return;
    }
    googleSheets.setUrl(gasUrl);
    setIsTestingGas(true);
    const res = await googleSheets.testConnection();
    setIsTestingGas(false);

    if (res.success) {
      setGasConnectedTitle(res.title || "Spreadsheet Terhubung");
      showNotice("✅ " + res.message);
    } else {
      alert("Koneksi gagal: " + res.message);
    }
  };

  const handleSyncToGoogleSheets = async () => {
    if (!googleSheets.isConfigured()) {
      setShowGoogleModal(true);
      setGoogleTab("connect");
      return;
    }
    setIsSyncingGas(true);
    const res = await googleSheets.syncAllToSheets({
      products: db.getProducts(),
      orders: db.getOrders(),
      cashflow: db.getCashflow(),
    });
    setIsSyncingGas(false);
    if (res.success) {
      showNotice("✅ " + res.message);
    } else {
      alert(res.message);
    }
  };

  const handleFetchFromGoogleSheets = async () => {
    if (!googleSheets.isConfigured()) {
      setShowGoogleModal(true);
      setGoogleTab("connect");
      return;
    }
    if (!confirm("Tarik data dari Google Sheets dan perbarui tabel toko Anda?")) return;

    setIsSyncingGas(true);
    const res = await googleSheets.fetchAllFromSheets();
    setIsSyncingGas(false);
    if (res.success && res.data) {
      if (res.data.products && res.data.products.length > 0) db.setProducts(res.data.products);
      if (res.data.orders && res.data.orders.length > 0) db.setOrders(res.data.orders);
      if (res.data.cashflow && res.data.cashflow.length > 0) db.setCashflow(res.data.cashflow);
      loadFromDatabase();
      if (onDataChanged) onDataChanged();
      showNotice("✅ Data dari Google Sheets berhasil ditarik dan diperbarui!");
    } else {
      alert(res.message || "Gagal menarik data dari Google Sheets.");
    }
  };

  const handleDisconnectGas = () => {
    if (confirm("Putuskan koneksi Google Sheets?")) {
      googleSheets.clearAll();
      setGasUrl("");
      setDocUrl("");
      setGasConnectedTitle(null);
      showNotice("Koneksi Google Sheets diputuskan.");
    }
  };

  const handleSaveDocUrl = () => {
    if (!docUrl.trim()) return;
    googleSheets.setDocUrl(docUrl);
    showNotice("Tautan dokumen spreadsheet Google Sheets berhasil disimpan!");
  };

  // FORMULA ENGINE
  const evaluateCell = (rawValue: string, currentRows: string[][]): { display: string; isFormula: boolean } => {
    if (!rawValue) return { display: "", isFormula: false };
    if (!rawValue.startsWith("=")) return { display: rawValue, isFormula: false };

    try {
      const formula = rawValue.substring(1).trim().toUpperCase();

      // Formula: SUM(A1:A5)
      const sumMatch = formula.match(/^SUM\(([A-Z])([0-9]+):([A-Z])([0-9]+)\)$/);
      if (sumMatch && sumMatch[1] && sumMatch[2] && sumMatch[3] && sumMatch[4]) {
        const col1 = sumMatch[1];
        const row1Str = sumMatch[2];
        const col2 = sumMatch[3];
        const row2Str = sumMatch[4];
        const c1 = col1.charCodeAt(0) - 65;
        const c2 = col2.charCodeAt(0) - 65;
        const r1 = parseInt(row1Str, 10) - 2; // Row index is 0-based, row 2 in formula is index 0
        const r2 = parseInt(row2Str, 10) - 2;

        let total = 0;
        const minR = Math.max(0, Math.min(r1, r2));
        const maxR = Math.min(currentRows.length - 1, Math.max(r1, r2));
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const cellVal = currentRows[r]?.[c] || "0";
            const evaluated = evaluateCell(cellVal, currentRows).display;
            const num = parseFloat(evaluated.replace(/[^0-9.-]/g, "")) || 0;
            total += num;
          }
        }
        return { display: String(total), isFormula: true };
      }

      // Formula: AVERAGE or AVG(A1:A5)
      const avgMatch = formula.match(/^(?:AVERAGE|AVG)\(([A-Z])([0-9]+):([A-Z])([0-9]+)\)$/);
      if (avgMatch && avgMatch[1] && avgMatch[2] && avgMatch[3] && avgMatch[4]) {
        const col1 = avgMatch[1];
        const row1Str = avgMatch[2];
        const col2 = avgMatch[3];
        const row2Str = avgMatch[4];
        const c1 = col1.charCodeAt(0) - 65;
        const c2 = col2.charCodeAt(0) - 65;
        const r1 = parseInt(row1Str, 10) - 2;
        const r2 = parseInt(row2Str, 10) - 2;

        let sum = 0;
        let count = 0;
        const minR = Math.max(0, Math.min(r1, r2));
        const maxR = Math.min(currentRows.length - 1, Math.max(r1, r2));
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const cellVal = currentRows[r]?.[c] || "0";
            const evaluated = evaluateCell(cellVal, currentRows).display;
            const num = parseFloat(evaluated.replace(/[^0-9.-]/g, "")) || 0;
            sum += num;
            count++;
          }
        }
        return { display: count > 0 ? String(Math.round(sum / count)) : "0", isFormula: true };
      }

      // Formula: COUNT(A1:A5)
      const countMatch = formula.match(/^COUNT\(([A-Z])([0-9]+):([A-Z])([0-9]+)\)$/);
      if (countMatch && countMatch[1] && countMatch[2] && countMatch[3] && countMatch[4]) {
        const col1 = countMatch[1];
        const row1Str = countMatch[2];
        const col2 = countMatch[3];
        const row2Str = countMatch[4];
        const c1 = col1.charCodeAt(0) - 65;
        const c2 = col2.charCodeAt(0) - 65;
        const r1 = parseInt(row1Str, 10) - 2;
        const r2 = parseInt(row2Str, 10) - 2;
        const minR = Math.max(0, Math.min(r1, r2));
        const maxR = Math.min(currentRows.length - 1, Math.max(r1, r2));
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);
        let count = 0;
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const cellVal = currentRows[r]?.[c];
            if (cellVal !== undefined && cellVal !== "") count++;
          }
        }
        return { display: String(count), isFormula: true };
      }

      // Formula: Arithmetic between cells, e.g. D2*E2, B2-C2, A1+B1, C2/2
      const cellRefRegex = /([A-Z])([0-9]+)/g;
      const parsedFormula = formula.replace(cellRefRegex, (_, colLetter, rowNumStr) => {
        const colIdx = colLetter.charCodeAt(0) - 65;
        const rowIdx = parseInt(rowNumStr, 10) - 2;
        const refVal = currentRows[rowIdx]?.[colIdx] || "0";
        const evalRef = evaluateCell(refVal, currentRows).display;
        const cleanNum = parseFloat(evalRef.replace(/[^0-9.-]/g, "")) || 0;
        return String(cleanNum);
      });

      // Safe arithmetic evaluator (numbers and +-/*() only)
      if (/^[0-9+\-*/().\s]+$/.test(parsedFormula)) {
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${parsedFormula})`)();
        return { display: String(Math.round(Number(res) * 100) / 100), isFormula: true };
      }

      return { display: rawValue, isFormula: true };
    } catch {
      return { display: "#ERROR!", isFormula: true };
    }
  };

  // Save changes to UMKM store database
  const saveToDatabase = () => {
    try {
      const mappedOrders: Order[] = orderRows.map((r, idx) => {
        const totalRaw = evaluateCell(r[3] || "0", orderRows).display;
        return {
          id: r[0] || getNextSequentialId(orderRows.slice(0, idx).map((row) => ({ id: row[0] })), "ORD"),
          customer: r[1] || "Pelanggan",
          product: r[2] || "Pesanan",
          total: Math.max(0, parseInt(totalRaw.replace(/\D/g, ""), 10) || 0),
          status: (r[4] as Order["status"]) || "Proses",
          date: r[5] || "Hari Ini",
          notes: r[6] || "",
        };
      });
      db.setOrders(mappedOrders);

      setHasUnsavedChanges(false);
      showNotice("✅ Perubahan spreadsheet pesanan berhasil disimpan ke database toko & Supabase!");
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan ke database.");
    }
  };

  // Add Row
  const handleAddRow = () => {
    const newId = getNextSequentialId(orderRows.map((r) => ({ id: r[0] })), "ORD");
    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newRow = [
      newId,
      "Pelanggan Baru",
      "Menu Donat / Cookies",
      "0",
      "Proses",
      nowStr,
      "",
    ];

    const newRows = [...orderRows, newRow];
    setOrderRows(newRows);
    setHasUnsavedChanges(true);
    setSelectedCell({ row: newRows.length - 1, col: 1 });
  };

  // Delete Row
  const handleDeleteRow = () => {
    if (!selectedCell) return;
    if (activeRows.length <= 1) {
      alert("Spreadsheet harus memiliki minimal 1 baris data.");
      return;
    }
    const targetIdx = selectedCell.row;
    const newRows = activeRows.filter((_, idx) => idx !== targetIdx);
    setActiveRows(newRows);
    setSelectedCell({
      row: Math.min(targetIdx, newRows.length - 1),
      col: selectedCell.col,
    });
    showNotice(`Baris #${targetIdx + 1} berhasil dihapus.`);
  };

  // Cell Editing Handlers
  const startEditing = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(activeRows[row]?.[col] || "");
  };

  const commitEdit = (newValue?: string) => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const valToSave = newValue !== undefined ? newValue : editValue;

    const newRows = activeRows.map((r, rIdx) => {
      if (rIdx === row) {
        const updated = [...r];
        updated[col] = valToSave;
        return updated;
      }
      return r;
    });

    setActiveRows(newRows);
    setEditingCell(null);
  };

  // Keyboard navigation on grid
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
        // Move to next row
        if (selectedCell && selectedCell.row < activeRows.length - 1) {
          setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
        }
      } else if (e.key === "Escape") {
        setEditingCell(null);
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        if (selectedCell) {
          const nextCol = e.shiftKey
            ? Math.max(0, selectedCell.col - 1)
            : Math.min(activeCols.length - 1, selectedCell.col + 1);
          setSelectedCell({ row: selectedCell.row, col: nextCol });
        }
      }
      return;
    }

    if (!selectedCell) return;

    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      startEditing(selectedCell.row, selectedCell.col);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedCell({ row: Math.max(0, selectedCell.row - 1), col: selectedCell.col });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedCell({
        row: Math.min(activeRows.length - 1, selectedCell.row + 1),
        col: selectedCell.col,
      });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedCell({ row: selectedCell.row, col: Math.max(0, selectedCell.col - 1) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedCell({
        row: selectedCell.row,
        col: Math.min(activeCols.length - 1, selectedCell.col + 1),
      });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (!activeCols[selectedCell.col]?.readOnly) {
        const newRows = activeRows.map((r, rIdx) => {
          if (rIdx === selectedCell.row) {
            const updated = [...r];
            updated[selectedCell.col] = "";
            return updated;
          }
          return r;
        });
        setActiveRows(newRows);
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!activeCols[selectedCell.col]?.readOnly) {
        startEditing(selectedCell.row, selectedCell.col);
        setEditValue(e.key);
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = orderCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = orderRows.map((r) =>
      r
        .map((cell) => {
          const evalResult = evaluateCell(cell, orderRows).display;
          return `"${(evalResult || "").replace(/"/g, '""')}"`;
        })
        .join(","),
    );

    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spreadsheet_pesanan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice(`File CSV Pesanan & Penjualan berhasil diekspor.`);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          alert("File CSV tidak memiliki data yang cukup.");
          return;
        }

        // Simple CSV Parser splitting by comma, respecting quotes
        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const parsedRows = lines.slice(1).map(parseLine);
        // Pad rows to match activeCols length
        const formattedRows = parsedRows.map((r) => {
          const rowArr = Array(activeCols.length).fill("");
          r.forEach((val, i) => {
            if (i < activeCols.length) rowArr[i] = val;
          });
          return rowArr;
        });

        setActiveRows(formattedRows);
        showNotice(`Berhasil mengimpor ${formattedRows.length} baris data dari CSV.`);
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file CSV. Pastikan format kolom sesuai.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Filtered rows for Search
  const displayRows = useMemo(() => {
    if (!searchQuery.trim()) return activeRows;
    const q = searchQuery.toLowerCase();
    return activeRows.filter((r) => r.some((c) => (c || "").toLowerCase().includes(q)));
  }, [activeRows, searchQuery]);

  // Selected cell current info
  const currentCellInfo = useMemo(() => {
    if (!selectedCell) return { coord: "A1", value: "", formula: "" };
    const colLetter = activeCols[selectedCell.col]?.letter || "A";
    const rowNum = selectedCell.row + 2; // +2 because header is row 1
    const raw = activeRows[selectedCell.row]?.[selectedCell.col] || "";
    return {
      coord: `${colLetter}${rowNum}`,
      value: raw,
      evalDisplay: evaluateCell(raw, activeRows).display,
    };
  }, [selectedCell, activeCols, activeRows]);

  // Quick statistics calculation on currently selected column or all numbers
  const columnStats = useMemo(() => {
    if (!selectedCell) return null;
    const colIdx = selectedCell.col;
    const colDef = activeCols[colIdx];
    if (!colDef) return null;

    let sum = 0;
    let count = 0;
    activeRows.forEach((r) => {
      const val = evaluateCell(r[colIdx] || "", activeRows).display;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
      if (!isNaN(num)) {
        sum += num;
        count++;
      }
    });

    return {
      colName: colDef.header,
      count,
      sum,
      avg: count > 0 ? Math.round(sum / count) : 0,
      isCurrency: colDef.type === "currency",
    };
  }, [selectedCell, activeCols, activeRows]);

  return (
    <div
      className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/30 px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Spreadsheet Pesanan & Penjualan</h2>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Belum Disimpan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Tersinkron DB
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tabel pencatatan langsung pesanan masuk, status transaksi & omzet terhubung ke Google Sheets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google Sheets Integration Button */}
          <button
            onClick={() => setShowGoogleModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              googleSheets.isConfigured()
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            title="Integrasikan dengan Google Sheets & Google Apps Script"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Google Sheets & Apps Script</span>
            {googleSheets.isConfigured() && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Quick Sync to Google Sheets if connected */}
          {googleSheets.isConfigured() && (
            <button
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncingGas}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              title="Kirim semua data saat ini ke Google Sheets"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingGas ? "animate-spin" : ""}`} />
              <span>{isSyncingGas ? "Menyinkronkan..." : "Sync Sheets"}</span>
            </button>
          )}

          {/* Direct link to Google Sheets Document */}
          {googleSheets.hasDocUrl() && (
            <a
              href={googleSheets.getDocUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
              title="Buka Dokumen di Google Sheets"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
              <span>Buka Google Sheets</span>
            </a>
          )}

          {/* Download Ready-Made .xlsx Document */}
          <a
            href="/UMKM_Manager_Donat_Cookies.xlsx"
            download="UMKM_Manager_Donat_Cookies.xlsx"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
            title="Download Dokumen Spreadsheet Excel (.xlsx) Siap Pakai"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">Download .XLSX</span>
          </a>

          {hasUnsavedChanges && (
            <button
              onClick={saveToDatabase}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan ke Database Toko
            </button>
          )}

          <button
            onClick={loadFromDatabase}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
            title="Muat ulang dari Database lokal / Supabase"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Impor CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 2. SUMMARY & FILTER STATS BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-background px-4 py-2 gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
            <span>Sheet Pesanan & Penjualan</span>
            <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              {orderRows.length} Data
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground border-l border-border pl-3">
            <span>
              Total Omzet:{" "}
              <strong className="text-foreground">
                Rp {totalOrderOmzet.toLocaleString("id-ID")}
              </strong>
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>
              Selesai:{" "}
              <strong className="text-emerald-600 font-semibold">{orderCountSelesai}</strong>
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>
              Proses:{" "}
              <strong className="text-blue-600 font-semibold">{orderCountProses}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition cursor-pointer"
            title="Tambah Baris Pesanan Baru (ORD-00X)"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Pesanan</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/40 px-4 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {feedbackMessage}
          </span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. TOOLBAR & FORMULA BAR */}
      <div className="flex flex-col border-b border-border bg-card">
        {/* Sub-toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-border/50 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
              title="Tambah baris baru di bawah tabel"
            >
              <Plus className="h-3 w-3 text-emerald-600" />
              <span>Tambah Baris</span>
            </button>

            <button
              onClick={handleDeleteRow}
              disabled={!selectedCell || activeRows.length <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-40"
              title="Hapus baris yang sedang dipilih"
            >
              <Trash2 className="h-3 w-3" />
              <span>Hapus Baris</span>
            </button>

            <button
              onClick={() => setShowFormulaHelp(!showFormulaHelp)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <Calculator className="h-3 w-3 text-primary" />
              <span>Panduan Rumus</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam tabel..."
              className="w-48 rounded-lg border border-border bg-background pl-8 pr-3 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Formula Help Drawer / Accordion */}
        {showFormulaHelp && (
          <div className="bg-primary/5 border-b border-primary/20 p-3.5 text-xs space-y-1.5">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Dukungan Rumus Formula Spreadsheet:
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
              <div className="bg-card p-2 rounded-lg border border-border">
                <code className="text-primary font-bold">=SUM(D2:D10)</code>
                <p>Menjumlahkan nilai kolom D dari baris 2 hingga 10.</p>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <code className="text-primary font-bold">=AVERAGE(D2:D10)</code>
                <p>Menghitung rata-rata nilai numerik dalam rentang sel.</p>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <code className="text-primary font-bold">=D2*E2</code>
                <p>Perkalian antar sel (misal: Harga × Stok).</p>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <code className="text-primary font-bold">=B2-C2</code>
                <p>Operasi pengurangan, pembagian (/) atau tambah (+).</p>
              </div>
            </div>
          </div>
        )}

        {/* FORMULA BAR (Like Excel) */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/20 text-xs">
          {/* Coordinate Box */}
          <div className="flex h-7 w-16 items-center justify-center rounded border border-border bg-background font-mono font-bold text-primary">
            {currentCellInfo.coord}
          </div>

          <span className="font-mono font-bold text-muted-foreground">ƒx</span>

          {/* Formula / Cell Content Input */}
          <input
            value={
              editingCell
                ? editValue
                : currentCellInfo.value
            }
            onChange={(e) => {
              if (selectedCell) {
                if (!editingCell) setEditingCell(selectedCell);
                setEditValue(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitEdit();
              }
            }}
            placeholder="Ketik nilai atau rumus (misal: =SUM(D2:D6) atau teks)..."
            className="flex-1 h-7 rounded border border-border bg-background px-3 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />

          {currentCellInfo.value.startsWith("=") && (
            <div className="hidden sm:flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
              <span>Hasil:</span>
              <strong className="text-foreground">{currentCellInfo.evalDisplay}</strong>
            </div>
          )}
        </div>
      </div>

      {/* 4. SPREADSHEET GRID CANVAS */}
      <div
        ref={tableContainerRef}
        className="max-h-[520px] overflow-auto border-b border-border bg-background select-none font-sans"
      >
        <table className="w-full border-collapse text-left text-xs">
          {/* HEADER ROW (A, B, C, D...) */}
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm shadow-sm">
            <tr>
              {/* Row index header top-left */}
              <th className="w-12 border-b border-r border-border bg-muted/60 p-2 text-center font-mono text-[11px] font-bold text-muted-foreground">
                #
              </th>
              {activeCols.map((col, cIdx) => (
                <th
                  key={col.id}
                  style={{ width: col.width, minWidth: col.width }}
                  className={`border-b border-r border-border p-2 font-semibold transition ${
                    selectedCell?.col === cIdx
                      ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground font-bold">
                        {col.letter}
                      </span>
                      <span className="truncate">{col.header}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY ROWS (1, 2, 3...) */}
          <tbody className="divide-y divide-border">
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeCols.length + 1}
                  className="py-12 text-center bg-card/50"
                >
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground p-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {activeSheet === "orders" ? "Belum Ada Pesanan Masuk" : "Tabel Kosong"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activeSheet === "orders"
                        ? "Pesanan baru dari website atau input kasir akan langsung muncul otomatis di sini secara realtime!"
                        : "Klik tombol Tambah Baris untuk memasukkan data baru."}
                    </p>
                    <button
                      onClick={handleAddRow}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{activeSheet === "orders" ? "Input Pesanan Baru" : "Tambah Baris"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              displayRows.map((row, rIdx) => {
                const isRowSelected = selectedCell?.row === rIdx;
                const rowNum = rIdx + 2; // +2 for Excel numbering

              return (
                <tr
                  key={rIdx}
                  className={`transition-colors ${
                    isRowSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  {/* Row Number Header */}
                  <td
                    onClick={() => setSelectedCell({ row: rIdx, col: 0 })}
                    className={`border-r border-border p-2 text-center font-mono text-[11px] cursor-pointer transition ${
                      isRowSelected
                        ? "bg-emerald-500/20 font-bold text-emerald-800 dark:text-emerald-300"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {rowNum}
                  </td>

                  {/* Cell Columns */}
                  {activeCols.map((col, cIdx) => {
                    const rawVal = row[cIdx] || "";
                    const { display, isFormula } = evaluateCell(rawVal, activeRows);
                    const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                    const isEditing = editingCell?.row === rIdx && editingCell?.col === cIdx;

                    return (
                      <td
                        key={col.id}
                        onClick={() => {
                          setSelectedCell({ row: rIdx, col: cIdx });
                          if (isEditing) return;
                          setEditingCell(null);
                        }}
                        onDoubleClick={() => {
                          if (!col.readOnly) startEditing(rIdx, cIdx);
                        }}
                        className={`relative border-r border-border p-1.5 transition ${
                          isSelected
                            ? "outline-2 outline-emerald-600 outline-offset-[-2px] bg-emerald-500/10"
                            : ""
                        } ${col.readOnly ? "bg-muted/20 text-muted-foreground cursor-not-allowed" : "cursor-cell"}`}
                      >
                        {isEditing ? (
                          col.type === "select" && col.options ? (
                            <select
                              autoFocus
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                commitEdit(e.target.value);
                              }}
                              onBlur={() => commitEdit()}
                              className="w-full rounded bg-background p-1 text-xs border border-primary outline-none"
                            >
                              {col.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit()}
                              className="w-full rounded bg-background p-1 font-mono text-xs border border-primary outline-none shadow-sm"
                            />
                          )
                        ) : (
                          <div className="flex items-center justify-between min-h-[22px] px-1 truncate">
                            {/* Value Display */}
                            {col.type === "currency" ? (
                              <span className="font-mono text-right w-full">
                                {display && !isNaN(Number(display.replace(/[^0-9.-]/g, "")))
                                  ? `Rp ${parseInt(
                                      display.replace(/[^0-9.-]/g, ""),
                                      10,
                                    ).toLocaleString("id-ID")}`
                                  : display || "-"}
                              </span>
                            ) : col.type === "select" && col.id === "status" ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  display === "Selesai"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : display === "Proses"
                                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {display || "Pending"}
                              </span>
                            ) : col.type === "select" && col.id === "type" ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  display === "in"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                }`}
                              >
                                {display === "in" ? "+ Masuk (Omzet)" : "- Keluar (Biaya)"}
                              </span>
                            ) : (
                              <span
                                className={`truncate ${
                                  isFormula ? "font-mono font-medium text-emerald-700 dark:text-emerald-300" : ""
                                }`}
                              >
                                {display || (col.readOnly ? "-" : "")}
                              </span>
                            )}

                            {/* Small Formula Indicator Tag */}
                            {isFormula && (
                              <span
                                title={`Formula: ${rawVal}`}
                                className="ml-1 text-[9px] font-bold text-muted-foreground/60 select-none"
                              >
                                ƒx
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM STATUS BAR & QUICK FORMULA TOTALS */}
      <div className="flex flex-wrap items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground gap-3">
        <div className="flex items-center gap-4">
          <span>
            Total: <b>{activeRows.length} Baris</b>
          </span>
          <span className="hidden sm:inline">
            Sheet Aktif: <b className="text-foreground">Pesanan & Penjualan</b>
          </span>
          <span className="text-[11px] text-muted-foreground">
            💡 Klik dua kali sel atau tekan <b>Enter</b> untuk mengedit langsung
          </span>
        </div>

        {/* Live Calculation Widget for Selected Column */}
        {columnStats && columnStats.count > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1 font-mono text-[11px] shadow-sm">
            <span>
              Kolom <b>{columnStats.colName}</b>:
            </span>
            <span>
              SUM ={" "}
              <b className="text-foreground">
                {columnStats.isCurrency
                  ? `Rp ${columnStats.sum.toLocaleString("id-ID")}`
                  : columnStats.sum.toLocaleString("id-ID")}
              </b>
            </span>
            <span className="hidden md:inline">
              AVG ={" "}
              <b className="text-foreground">
                {columnStats.isCurrency
                  ? `Rp ${columnStats.avg.toLocaleString("id-ID")}`
                  : columnStats.avg.toLocaleString("id-ID")}
              </b>
            </span>
            <span className="hidden lg:inline text-muted-foreground">
              COUNT = {columnStats.count}
            </span>
          </div>
        )}
      </div>

      {/* 6. MODAL: GOOGLE SHEETS & APPS SCRIPT */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Integrasi Google Sheets & Apps Script</h3>
                  <p className="text-xs text-muted-foreground">
                    Sinkronkan produk, pesanan, dan arus kas langsung dengan Google Sheets resmi Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex border-b border-border gap-2">
              <button
                onClick={() => setGoogleTab("setup")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  googleTab === "setup"
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>1. Panduan & Kode Apps Script</span>
              </button>
              <button
                onClick={() => setGoogleTab("connect")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  googleTab === "connect"
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 className="h-4 w-4" />
                <span>2. Hubungkan URL & Sinkronisasi</span>
                {googleSheets.isConfigured() && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* TAB 1: PANDUAN & KODE */}
            {googleTab === "setup" && (
              <div className="mt-4 space-y-4 text-xs">
                {/* Dokumen Excel Siap Pakai Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div>
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      Dokumen Spreadsheet Excel Resmi Telah Dibuat!
                    </h4>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 max-w-md leading-relaxed">
                      File <code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded">UMKM_Manager_Donat_Cookies.xlsx</code> sudah siap diunduh. Berisi 4 sheet (Dashboard Ringkasan, Produk & Stok, Pesanan, Arus Kas) dengan format rapi dan rumus otomatis.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="/UMKM_Manager_Donat_Cookies.xlsx"
                      download="UMKM_Manager_Donat_Cookies.xlsx"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh .XLSX</span>
                    </a>
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      <span>Upload ke Google Drive</span>
                    </a>
                  </div>
                </div>

                {/* 1-Click Copy Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
                  <div>
                    <h4 className="font-bold text-foreground">
                      Kode Apps Script: <code className="font-mono text-primary">google-sheets-script.js</code>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Menambahkan menu otomatis <b>"🧁 UMKM Manager"</b> langsung di bar atas Google Sheets Anda.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyGasCode}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 shrink-0 cursor-pointer"
                  >
                    {gasCopyCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{gasCopyCopied ? "Tersalin ke Clipboard!" : "Salin Kode Apps Script"}</span>
                  </button>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Upload File ke Google Drive & Buka</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Upload file <code className="font-mono">UMKM_Manager_Donat_Cookies.xlsx</code> yang baru diunduh ke{" "}
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary underline inline-flex items-center gap-0.5"
                        >
                          Google Drive <ExternalLink className="h-2.5 w-2.5" />
                        </a>{" "}
                        lalu buka filenya di <b>Google Sheets</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Buka Menu Ekstensi → Apps Script</p>
                      <p className="text-muted-foreground mt-0.5">
                        Di menu atas spreadsheet, klik: <b>Ekstensi (Extensions) → Apps Script</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Tempel (Paste) Kode & Simpan</p>
                      <p className="text-muted-foreground mt-0.5">
                        Hapus kode bawaan di editor, klik tombol <b>Salin Kode Apps Script</b> di atas, lalu tempel (Paste). Tekan <b>Ctrl+S</b> untuk menyimpan.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      4
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Menu "🧁 UMKM Manager" Otomatis Aktif di Google Sheets!</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Muat ulang (refresh) halaman Google Sheets Anda. Di menu bar atas akan muncul menu baru <b>"🧁 UMKM Manager"</b> untuk input pesanan cepat, merapikan rumus, dan sinkronisasi ke website langsung dari dalam spreadsheet!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setGoogleTab("connect")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 cursor-pointer"
                  >
                    <span>Lanjut ke Langkah 2: Hubungkan Dokumen & Web App</span>
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: HUBUNGKAN URL & SYNC */}
            {googleTab === "connect" && (
              <div className="mt-4 space-y-4 text-xs">
                {/* 1. Direct Document Link */}
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                  <label className="font-semibold text-foreground block">
                    Tautan Dokumen Spreadsheet Google Sheets Anda (Document URL)
                  </label>
                  <p className="text-muted-foreground text-[11px]">
                    Salin URL dokumen Google Sheets dari browser Anda (misal: <code className="font-mono bg-muted px-1 rounded">https://docs.google.com/spreadsheets/d/.../edit</code>).
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                      className="flex-1 rounded-xl border border-border bg-background p-2.5 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleSaveDocUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 shrink-0 cursor-pointer"
                    >
                      <span>Simpan Tautan</span>
                    </button>
                    {googleSheets.hasDocUrl() && (
                      <a
                        href={googleSheets.getDocUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Buka Dokumen</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. Web App URL */}
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                  <label className="font-semibold text-foreground block">
                    URL Aplikasi Web Google Apps Script (Web App URL)
                  </label>
                  <p className="text-muted-foreground text-[11px]">
                    Diperlukan untuk sinkronisasi otomatis. Didapat dari menu <b>Terapkan (Deploy) → Penerapan baru → Aplikasi web</b> di editor Apps Script (berakhiran <code className="font-mono bg-muted px-1 rounded">/exec</code>).
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={gasUrl}
                      onChange={(e) => setGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="flex-1 rounded-xl border border-border bg-background p-2.5 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleTestGasConnection}
                      disabled={isTestingGas}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isTestingGas ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      <span>{isTestingGas ? "Menguji..." : "Tes & Simpan"}</span>
                    </button>
                  </div>
                </div>

                {/* Status Box */}
                <div
                  className={`rounded-xl border p-3.5 ${
                    googleSheets.isConfigured()
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          googleSheets.isConfigured() ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="font-bold text-xs">
                        {googleSheets.isConfigured()
                          ? `Sinkronisasi Aktif: ${gasConnectedTitle || "Terhubung ke Google Sheets"}`
                          : "Sinkronisasi Otomatis Belum Aktif"}
                      </span>
                    </div>
                    {googleSheets.isConfigured() && (
                      <button
                        onClick={handleDisconnectGas}
                        className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        Putuskan Koneksi
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    {googleSheets.isConfigured()
                      ? "Setiap pesanan baru di website secara otomatis dicatat ke Google Sheets Anda secara real-time."
                      : "Masukkan Web App URL lalu klik 'Tes & Simpan' agar data pesanan website otomatis masuk ke Google Sheets."}
                  </p>
                </div>

                {/* Two-Way Sync Actions */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h4 className="font-bold text-xs text-foreground">Operasi Sinkronisasi Data Dua Arah</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleSyncToGoogleSheets}
                      disabled={isSyncingGas || !googleSheets.isConfigured()}
                      className="flex flex-col items-start gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-left transition hover:bg-emerald-500/15 disabled:opacity-40 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                        <Upload className="h-4 w-4" />
                        <span>Kirim ke Dokumen Google Sheets</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Kirim seluruh katalog produk, pesanan, & arus kas toko ke Google Sheets.
                      </p>
                    </button>

                    <button
                      onClick={handleFetchFromGoogleSheets}
                      disabled={isSyncingGas || !googleSheets.isConfigured()}
                      className="flex flex-col items-start gap-1 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 text-left transition hover:bg-blue-500/15 disabled:opacity-40 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                        <Download className="h-4 w-4" />
                        <span>Tarik dari Dokumen Google Sheets</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Perbarui data website dengan isi terbaru yang ada di dokumen Google Sheets Anda.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowGoogleModal(false)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
