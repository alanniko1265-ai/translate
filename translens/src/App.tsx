import { useAppStore } from "./stores/appStore";
import { TranslationPop } from "./components/TranslationPop/TranslationPop";
import { HistoryPanel } from "./components/HistoryPanel";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { ScreenshotOverlay } from "./components/ScreenshotOverlay";
import { ChatBubble } from "./components/ChatBubble/ChatBubble";
import { Toaster } from "react-hot-toast";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");

  const isOverlayMode = mode === "overlay";
  const isTranslationOverlayMode = mode === "translation-overlay";

  useGlobalShortcuts(!isOverlayMode && !isTranslationOverlayMode);
  const activeTab = useAppStore((s) => s.activeTab);

  if (isOverlayMode) {
    return <ScreenshotOverlay />;
  }

  if (isTranslationOverlayMode) {
    return (
      <>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.95)",
              color: "#F8FAFC",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              fontSize: "13px",
              padding: "8px 14px",
            },
          }}
        />
        <ChatBubble />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(30, 41, 59, 0.9)",
            color: "#F8FAFC",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "translate" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <TranslationPop />
          </div>
        )}
        {activeTab === "history" && <HistoryPanel />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}
