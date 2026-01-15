"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { isValidSaveFile, readFileAsText } from "@/lib/utils";
import { validateSaveFile } from "@/lib/xml-parser";

interface FileUploadProps {
  onFileLoaded: (
    xmlContent: string,
    fileName: string,
    fileHandle?: FileSystemFileHandle,
  ) => void;
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File, handle?: FileSystemFileHandle) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!isValidSaveFile(file)) {
          throw new Error("Invalid file type. Please upload an XML file.");
        }

        const content = await readFileAsText(file);
        const validation = validateSaveFile(content);

        if (!validation.valid) {
          throw new Error(validation.error);
        }

        onFileLoaded(content, file.name, handle);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
      } finally {
        setIsLoading(false);
      }
    },
    [onFileLoaded],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleClick = async () => {
    // Try File System Access API first
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Risk of Rain 2 Save File",
              accept: {
                "text/xml": [".xml"],
              },
            },
          ],
          excludeAcceptAllOption: false,
          multiple: false,
        });

        const file = await handle.getFile();
        await processFile(file, handle);
        return;
      } catch (err) {
        // User cancelled or error, ignore
        if ((err as Error).name !== "AbortError") {
          console.error("File picker error:", err);
        } else {
          return; // Don't fallback to input click if user explicitly cancelled the picker
        }
      }
    }

    // Fallback to standard input
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative cursor-pointer
          ror-card
          p-12
          transition-all duration-200
          group
          overflow-hidden
          ${isDragging ? "border-ror-orange-accent bg-ror-bg-panel/80" : "hover:bg-ror-bg-panel/50"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Scanning Line Animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-ror-orange-accent/5 to-transparent pointer-events-none"
          animate={{
            y: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Corner Accents (RoR2 Style) */}
        <div
          className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors ${isDragging ? "border-ror-orange-accent" : "border-ror-text-muted"}`}
        />
        <div
          className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors ${isDragging ? "border-ror-orange-accent" : "border-ror-text-muted"}`}
        />
        <div
          className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors ${isDragging ? "border-ror-orange-accent" : "border-ror-text-muted"}`}
        />
        <div
          className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors ${isDragging ? "border-ror-orange-accent" : "border-ror-text-muted"}`}
        />

        <div className="flex flex-col items-center justify-center gap-6 relative z-10">
          {/* Icon Container */}
          <motion.div
            animate={{
              rotate: isLoading ? 360 : 0,
              scale: isDragging ? 1.1 : 1,
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.2 },
            }}
            className={`
              w-20 h-20 bg-ror-bg-main border border-ror-border flex items-center justify-center
              transition-colors duration-300
              ${isDragging ? "border-ror-orange-accent" : "group-hover:border-ror-text-muted"}
            `}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-ror-orange-accent border-t-transparent rounded-full" />
            ) : (
              <Upload
                size={32}
                className={`transition-colors ${isDragging ? "text-ror-orange-accent" : "text-ror-text-muted group-hover:text-ror-text-main"}`}
              />
            )}
          </motion.div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-display text-ror-text-main tracking-wider">
              {isDragging ? "INITIATE TRANSFER" : "UPLOAD USER PROFILE"}
            </h3>
            <p className="text-ror-text-muted text-sm max-w-xs mx-auto">
              Drag and drop{" "}
              <span className="text-ror-text-main font-mono">
                UserProfile.xml
              </span>{" "}
              or click to browse local files.
            </p>
          </div>

          {/* Button-like visual */}
          <div
            className={`
            px-6 py-2 text-xs tracking-widest font-display uppercase
            border transition-all duration-200
            ${isDragging
                ? "border-ror-orange-accent text-ror-orange-accent bg-ror-orange-accent/10"
                : "border-ror-border text-ror-text-dim group-hover:border-ror-text-muted group-hover:text-ror-text-main"
              }
          `}
          >
            {isLoading ? "PROCESSING..." : "SELECT FILE"}
          </div>

          {/* Path hint */}
          <div className="text-center mt-4">
            <p className="text-ror-text-dim text-[10px] tracking-wider mb-1 uppercase">
              Target Directory
            </p>
            <code className="text-ror-text-muted text-[10px] block font-mono bg-ror-bg-main px-2 py-1 rounded-sm border border-ror-border">
              Steam/userdata/[ID]/632360/remote/UserProfiles
            </code>
          </div>
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 border border-ror-legendary bg-ror-legendary/10 flex items-start gap-3"
          >
            <AlertCircle
              size={18}
              className="text-ror-legendary flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-ror-legendary font-display text-sm tracking-wider">
                ERROR
              </p>
              <p className="text-ror-text-main text-sm mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              className="text-ror-text-muted hover:text-ror-legendary transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
