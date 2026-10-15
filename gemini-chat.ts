/**
 * Script Chatbot Gemini AI dengan Knowledge Base Toko Donat & Cookies Bekasi
 *
 * Cara Menjalankan:
 * 1. Pastikan dependencies terpasang:
 *    npm install @google/genai dotenv
 * 2. Tambahkan GEMINI_API_KEY di file .env Anda:
 *    GEMINI_API_KEY=AIzaSy...
 * 3. Jalankan script:
 *    npx tsx gemini-chat.ts "Halo, ada rekomendasi donat dan cookies yang best seller?"
 */

import { GoogleGenAI } from "@google/genai";
import { STORE_KNOWLEDGE } from "./knowledge";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY belum diatur di file .env");
    console.error("Silakan tambahkan GEMINI_API_KEY=kunci_api_anda ke file .env");
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  // Ambil pertanyaan dari argumen terminal, atau gunakan pertanyaan default
  const userInput =
    process.argv.slice(2).join(" ") ||
    "Halo! Boleh minta rekomendasi donat dan cookies apa yang paling laris? Dan bagaimana cara pemesanannya?";

  console.log(`\nPertanyaan Pelanggan: "${userInput}"\n`);
  console.log("Menghubungi Gemini AI...\n---\nJawaban Asisten:");

  const config = {
    systemInstruction: {
      parts: [
        {
          text: STORE_KNOWLEDGE,
        },
      ],
    },
    thinkingConfig: {
      thinkingLevel: "MINIMAL" as const,
    },
  };

  const model = "gemini-2.5-flash"; // atau 'gemini-3.1-flash-lite' bila akun Anda memiliki akses

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userInput,
            },
          ],
        },
      ],
    });

    for await (const chunk of response) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
      }
    }
    console.log("\n---\n");
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gagal memanggil Gemini API:", err.message);
  }
}

main();
