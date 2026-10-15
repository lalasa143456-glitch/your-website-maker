import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, AlertCircle, ExternalLink } from "lucide-react";

const WA_ADMIN_URL = "https://wa.me/6281213141516?text=" + encodeURIComponent("Halo Admin, saya ingin bertanya tentang pesanan Donat & Cookies.");

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Halo Kak! Ada yang bisa kami bantu?",
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll ke pesan terbawah saat ada pesan baru atau loading
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Fokus ke input ketika panel chat dibuka
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (trimmedInput.length > 500) {
      alert("Pesan maksimal 500 karakter.");
      return;
    }

    // Tambahkan pesan user ke tampilan
    const userMessage = { role: "user", text: trimmedInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Ambil maksimal 10 pesan terakhir sebelum pesan yang baru dikirim untuk riwayat
    const history = messages
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    const endpoint =
      import.meta.env.VITE_FORM_ENDPOINT ||
      "https://script.google.com/macros/s/AKfycbxNTp5jvxg4GBVWgoseSFXkIv58OHZ4YNVmcxlNdFdwu1BcAFg2-gENho3q8sRtP_rE/exec";

    try {
      // PENTING: fetch POST TANPA header Content-Type agar tidak terkena CORS preflight
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          form: "chat",
          message: trimmedInput,
          history: history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Koneksi terganggu (Status ${response.status})`);
      }

      const data = await response.json();

      if (data && data.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.reply,
          },
        ]);
      } else {
        const errText = data?.error || "Gagal mendapatkan respon dari server.";
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: errText,
            isError: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Maaf Kak, saat ini sedang terjadi gangguan jaringan.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* PANEL CHAT */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Panel Chat Bantuan"
          className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-[450px] max-h-[calc(100vh-6.5rem)] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* HEADER PANEL */}
          <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                <Bot className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight text-foreground">
                  Asisten Donat & Cookies
                </h3>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground transition"
              aria-label="Tutup Panel Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* DAFTAR PESAN */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                      isUser
                        ? "rounded-tr-xs bg-primary text-primary-foreground"
                        : msg.isError
                        ? "rounded-tl-xs border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        : "rounded-tl-xs bg-muted/80 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                    {/* Jika Error, tampilkan tombol direct ke WhatsApp Admin */}
                    {msg.isError && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/20">
                        <a
                          href={WA_ADMIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 text-[11px] transition shadow-xs"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Hubungi WhatsApp Admin
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[9px] text-muted-foreground px-1">
                    {isUser ? "Anda" : "Asisten"}
                  </span>
                </div>
              );
            })}

            {/* Indikator Mengetik */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-muted/80 px-3.5 py-2.5 text-muted-foreground shadow-xs">
                  <span className="text-[11px]">Mengetik</span>
                  <span className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FORM INPUT PESAN */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-border bg-card/80 p-2.5 backdrop-blur-xs"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan... (maks 500 huruf)"
                disabled={isLoading}
                className="w-full rounded-full border border-border bg-background py-2 pl-3.5 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Kirim Pesan"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Counter Karakter */}
            <div className="mt-1 flex justify-end px-1">
              <span className={`text-[9px] ${input.length >= 480 ? "text-rose-500 font-semibold" : "text-muted-foreground/70"}`}>
                {input.length}/500
              </span>
            </div>
          </form>

          {/* CATATAN KECIL DI BAGIAN BAWAH */}
          <div className="border-t border-border/50 bg-muted/40 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
            Dijawab oleh AI. Untuk pesanan &amp; kepastian, hubungi admin.
          </div>
        </div>
      )}

      {/* TOMBOL BULAT MELAYANG DI POJOK KANAN BAWAH */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Tutup chat asisten" : "Buka chat asisten"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200 rotate-0" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
          </div>
        )}
      </button>
    </>
  );
}
