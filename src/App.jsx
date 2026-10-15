import React from "react";
import ChatWidget from "./components/ChatWidget";

/**
 * App Component
 * Memasang <ChatWidget /> agar dapat digunakan di seluruh halaman
 */
export default function App({ children }) {
  return (
    <div className="min-h-screen">
      {children}
      <ChatWidget />
    </div>
  );
}

export { ChatWidget };
