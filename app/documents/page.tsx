"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Documents</h1>
      <p className="text-slate-300 mb-4">
        Upload your Irish documents here (GNIB/IRP letters, PPS letters, Revenue
        notices, rental agreements, etc.).
      </p>

      <div className="rounded-xl border border-dashed border-slate-700 p-6 mb-6">
        <label className="flex flex-col items-center justify-center gap-3 cursor-pointer">
          <span className="text-sm text-slate-300">
            Drag &amp; drop files here or click to choose
          </span>
          <span className="text-xs text-slate-500">
            PDFs, images and text documents
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div>
          <h2 className="font-medium mb-2 text-sm text-slate-200">
            Selected Files:
          </h2>
          <ul className="space-y-1 text-sm text-slate-300">
            {Array.from(selectedFiles).map((file) => (
              <li key={file.name} className="flex justify-between">
                <span>{file.name}</span>
                <span className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
