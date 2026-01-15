"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { SaveEditor } from "@/components/SaveEditor";
import type { RawUserProfile, SaveData } from "@/data/types";
import { loadSaveFile } from "@/lib/save-operations";
import { version } from "../../package.json";

type AppState = "upload" | "editing";

interface LoadedSave {
  raw: RawUserProfile;
  saveData: SaveData;
  fileName: string;
  fileHandle?: FileSystemFileHandle;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [loadedSave, setLoadedSave] = useState<LoadedSave | null>(null);

  const handleFileLoaded = useCallback(
    (
      xmlContent: string,
      fileName: string,
      fileHandle?: FileSystemFileHandle,
    ) => {
      try {
        const { raw, saveData } = loadSaveFile(xmlContent);
        setLoadedSave({ raw, saveData, fileName, fileHandle });
        setAppState("editing");
      } catch (error) {
        console.error("Failed to load save file:", error);
      }
    },
    [],
  );

  const handleReset = useCallback(() => {
    setLoadedSave(null);
    setAppState("upload");
  }, []);

  return (
    <div className="min-h-screen grid-bg flex flex-col overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ror-blue-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ror-orange-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Top Bar / Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-20 border-b border-ror-border flex items-center px-8 justify-between z-10 bg-ror-bg-header/80 backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-4 group/logo focus:outline-none"
          aria-label="Return to Home"
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 bg-ror-bg-main border border-ror-border flex items-center justify-center relative overflow-hidden group-hover/logo:border-ror-text-muted transition-colors"
          >
            <div className="absolute inset-0 bg-ror-text-main/5 group-hover/logo:bg-ror-text-main/10 transition-colors" />
            <ArtifactLogo className="w-6 h-6 text-ror-text-main" />
          </motion.div>
          <div className="text-left">
            <h1 className="text-2xl font-display text-ror-text-main tracking-[0.2em] leading-none group-hover/logo:text-white transition-colors">
              RAINSHIFT
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1px] w-8 bg-ror-orange-accent group-hover/logo:w-12 transition-all duration-300" />
              <span className="text-[10px] text-ror-text-dim tracking-widest uppercase group-hover/logo:text-ror-text-muted transition-colors">
                Profile Editor
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-[10px] text-ror-text-dim tracking-widest uppercase mb-0.5">
              System Status
            </div>
            <div className="text-xs text-ror-blue-accent font-mono">
              {`ONLINE // V.${version}`}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {appState === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Column: Welcome Text */}
                <div className="space-y-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <h2 className="text-5xl md:text-6xl font-display text-ror-text-main mb-6 leading-[0.9]">
                      REWRITE <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-ror-orange-accent to-ror-red-accent">
                        HISTORY
                      </span>
                    </h2>
                    <p className="text-ror-text-muted text-lg leading-relaxed max-w-md border-l-2 border-ror-border pl-6">
                      Access the UES Safe Travels database. Modify survivor
                      records, unlock artifacts, and alter simulation
                      parameters.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4 text-xs tracking-widest text-ror-text-dim uppercase">
                      <span>Supported Protocols</span>
                      <div className="h-[1px] flex-1 bg-ror-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ProtocolItem label="Standard Issue" code="BASE" />
                      <ProtocolItem label="Void Contamination" code="SOTV" />
                      <ProtocolItem label="Storm Seekers" code="SOTS" />
                      <ProtocolItem label="Alloyed Integration" code="AC" />
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Upload Box */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="w-full relative"
                >
                  {/* Decorative corner brackets */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-ror-text-dim/20" />
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-ror-text-dim/20" />

                  <FileUpload onFileLoaded={handleFileLoaded} />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col"
            >
              {loadedSave && (
                <SaveEditor
                  initialSaveData={loadedSave.saveData}
                  rawProfile={loadedSave.raw}
                  fileName={loadedSave.fileName}
                  fileHandle={loadedSave.fileHandle}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-ror-border bg-ror-bg-panel/50 backdrop-blur-sm text-ror-text-dim text-[10px] tracking-[0.2em] z-10 uppercase">
        {"UES Safe Travels // Terminal ID: 8832-B"}
      </footer>
    </div>
  );
}

function ProtocolItem({ label, code }: { label: string; code: string }) {
  return (
    <div className="flex items-center gap-3 p-2 border border-transparent hover:border-ror-border/50 hover:bg-ror-bg-panel/30 transition-all cursor-default group">
      <div className="w-1 h-1 bg-ror-text-dim group-hover:bg-ror-orange-accent transition-colors" />
      <div className="flex flex-col">
        <span className="text-[10px] text-ror-text-muted font-display tracking-wider">
          {code}
        </span>
        <span className="text-xs text-ror-text-dim group-hover:text-ror-text-main transition-colors">
          {label}
        </span>
      </div>
    </div>
  );
}

function ArtifactLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <title>Rainshift Logo</title>
      {/* Outer Diamond */}
      <path
        d="M12 2L22 12L12 22L2 12L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Geometric Core */}
      <path
        d="M12 6L18 12L12 18L6 12L12 6Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M12 6L18 12L12 18L6 12L12 6Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Vertical Line */}
      <path
        d="M12 6V18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Horizontal Cross Line */}
      <path
        d="M6 12H18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
