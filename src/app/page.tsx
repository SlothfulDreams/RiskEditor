"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { SaveEditor } from "@/components/SaveEditor";
import { SAMPLE_PROFILE_XML } from "@/data/sample-profile";
import type { RawUserProfile, SaveData } from "@/data/types";
import { loadSaveFile } from "@/lib/save-operations";

type AppState = "upload" | "editing";

interface LoadedSave {
  raw: RawUserProfile;
  saveData: SaveData;
  fileName: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [loadedSave, setLoadedSave] = useState<LoadedSave | null>(null);

  const handleFileLoaded = useCallback(
    (xmlContent: string, fileName: string) => {
      try {
        const { raw, saveData } = loadSaveFile(xmlContent);
        setLoadedSave({ raw, saveData, fileName });
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
            <div className="text-2xl font-display text-ror-text-main tracking-[0.2em] leading-none group-hover/logo:text-white transition-colors">
              RAINSHIFT
            </div>
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
              {"ONLINE // V.1.0.1"}
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
              className="flex-1 flex flex-col items-center px-6 py-14 md:p-8"
            >
              <div className="max-w-5xl w-full min-h-[calc(100svh-10rem)] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center content-center relative pb-16">
                {/* Left Column: Welcome Text */}
                <div className="space-y-10">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <h1 className="text-4xl md:text-6xl font-display text-ror-text-main mb-6 leading-[0.95]">
                      RISK OF RAIN 2 <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-ror-orange-accent to-ror-red-accent">
                        SAVE EDITOR
                      </span>
                    </h1>
                    <p className="text-ror-text-muted text-lg leading-relaxed max-w-md border-l-2 border-ror-border pl-6">
                      Edit your Risk of Rain 2 profile to unlock survivors,
                      skills, items, artifacts, and achievements or update your
                      lunar coins. Your save file stays in your browser.
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
                  <div className="relative">
                    {/* Decorative corner brackets */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-ror-text-dim/20" />
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-ror-text-dim/20" />

                    <FileUpload onFileLoaded={handleFileLoaded} />
                  </div>

                  <SampleSaveCard onLoad={handleFileLoaded} />
                </motion.div>

                <motion.a
                  href="#how-it-works"
                  aria-label="Scroll to the save editing guide"
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ror-text-dim hover:text-ror-orange-accent transition-colors"
                >
                  <span className="text-[10px] font-display tracking-[0.2em] whitespace-nowrap">
                    MORE BELOW
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.a>
              </div>

              <section
                aria-labelledby="how-it-works"
                className="max-w-5xl w-full mt-20 border-t border-ror-border pt-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
                  <div>
                    <p className="text-xs font-display tracking-widest text-ror-orange-accent mb-3">
                      LOCAL PROFILE TOOL
                    </p>
                    <h2
                      id="how-it-works"
                      className="text-3xl font-display text-ror-text-main leading-tight"
                    >
                      HOW TO EDIT YOUR ROR2 SAVE
                    </h2>
                    <p className="mt-5 text-sm leading-relaxed text-ror-text-muted">
                      RainShift reads and edits the XML profile on your device.
                      Nothing is uploaded to a server. Make a backup before
                      replacing your original save.
                    </p>
                  </div>

                  <ol className="grid gap-4">
                    <GuideStep number="01" title="Find your profile">
                      Open Steam/userdata/[Steam ID]/632360/remote/UserProfiles
                      and copy your UserProfile.xml file somewhere safe.
                    </GuideStep>
                    <GuideStep number="02" title="Choose your unlocks">
                      Load the XML file, then edit lunar coins or select the
                      survivors, skills, items, artifacts, and achievements you
                      want unlocked.
                    </GuideStep>
                    <GuideStep number="03" title="Export and replace">
                      Download the edited profile and replace the original file
                      while Risk of Rain 2 is closed. Keep your backup in case
                      you want to restore it.
                    </GuideStep>
                  </ol>
                </div>
              </section>

              <section
                aria-labelledby="frequently-asked-questions"
                className="max-w-5xl w-full mt-16 pb-10"
              >
                <h2
                  id="frequently-asked-questions"
                  className="text-2xl font-display text-ror-text-main mb-6"
                >
                  FREQUENTLY ASKED QUESTIONS
                </h2>
                <div className="grid gap-3">
                  <FaqItem question="Does RainShift upload my Risk of Rain 2 save?">
                    No. File reading, editing, and exporting happen locally in
                    your browser. RainShift does not send your XML profile to a
                    server.
                  </FaqItem>
                  <FaqItem question="What can the Risk of Rain 2 save editor unlock?">
                    RainShift can edit survivors, abilities, skins, items,
                    equipment, artifacts, achievements, and lunar coins across
                    the base game and supported DLC.
                  </FaqItem>
                  <FaqItem question="Should I back up UserProfile.xml first?">
                    Yes. Copy the original profile before editing it and close
                    the game before replacing the file. The backup lets you
                    restore your progress if needed.
                  </FaqItem>
                </div>
              </section>
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
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center border-t border-ror-border bg-ror-bg-panel/50 backdrop-blur-sm text-ror-text-dim text-[10px] tracking-[0.14em] z-10 uppercase">
        <span>{"UES Safe Travels // Terminal ID: 8832-B"}</span>
        <a
          href="https://github.com/SlothfulDreams/RainShift"
          target="_blank"
          rel="noreferrer"
          className="text-ror-text-muted hover:text-ror-text-main transition-colors underline underline-offset-4"
        >
          Source code on GitHub
        </a>
      </footer>
    </div>
  );
}

function GuideStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="ror-card p-5 flex gap-4">
      <span className="text-ror-orange-accent font-display text-sm">
        {number}
      </span>
      <div>
        <h3 className="font-display text-sm text-ror-text-main mb-2">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-ror-text-muted">
          {children}
        </p>
      </div>
    </li>
  );
}

function SampleSaveCard({
  onLoad,
}: {
  onLoad: (xmlContent: string, fileName: string) => void;
}) {
  return (
    <aside className="mt-8 ror-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ror-bg-panel/60">
      <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-ror-text-dim/20" />
      <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-ror-text-dim/20" />
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 border border-ror-border bg-ror-bg-main flex items-center justify-center text-ror-blue-accent flex-shrink-0">
          <FileText size={17} />
        </div>
        <div>
          <p className="text-xs font-display text-ror-text-main tracking-wider">
            NEW TO RAINSHIFT?
          </p>
          <p className="text-xs text-ror-text-muted mt-1">
            Load a sample save file to check out the editor.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onLoad(SAMPLE_PROFILE_XML, "SampleProfile.xml")}
        className="ror-button text-[10px] py-2 whitespace-nowrap flex-shrink-0"
      >
        LOAD SAMPLE SAVE
      </button>
    </aside>
  );
}

function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="ror-card group px-5 py-4">
      <summary className="cursor-pointer list-none font-display text-sm text-ror-text-main flex items-center justify-between gap-4">
        {question}
        <span
          aria-hidden="true"
          className="text-ror-orange-accent text-lg group-open:rotate-45 transition-transform"
        >
          +
        </span>
      </summary>
      <p className="mt-4 pr-8 text-sm leading-relaxed text-ror-text-muted">
        {children}
      </p>
    </details>
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
