"use client";

import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { authenticatedFetch, ApiError, listDocuments, type DocumentRead } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type FileUpload = {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  docId?: string;
};

type UploadResponse = {
  doc_id: string;
  chunks_indexed: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function DocumentsContent() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [documents, setDocuments] = useState<DocumentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }

  function addFiles(newFiles: File[]) {
    const fileUploads: FileUpload[] = newFiles.map((file) => ({
      file,
      status: "idle" as UploadStatus,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...fileUploads]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFile(fileUpload: FileUpload, index: number) {
    const { file } = fileUpload;

    if (!user) {
      console.error("No user found");
      return;
    }

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading" as UploadStatus, progress: 0 } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let docType = "other";
      if (fileExtension === "pdf") docType = "pdf";
      else if (fileExtension === "docx") docType = "docx";
      else if (fileExtension === "txt") docType = "text";
      
      formData.append("doc_type", docType);

      const res = await authenticatedFetch(`${API_BASE_URL}/user-docs/upload-file`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          errorBody.detail || `Upload failed with status ${res.status}`
        );
      }

      const data: UploadResponse = await res.json();

      // Update status to success
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "success" as UploadStatus,
                progress: 100,
                docId: data.doc_id,
              }
            : f
        )
      );
      
      await loadDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      
      // Don't show error if it's a 401 (handled by authenticatedFetch)
      if (err instanceof ApiError && err.status === 401) {
        return;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please try again.";

      // Update status to error
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error" as UploadStatus,
                progress: 0,
                error: errorMessage,
              }
            : f
        )
      );
    }
  }

  async function handleUploadAll() {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "idle") {
        await uploadFile(files[i], i);
      }
    }
  }

  function handleRetry(index: number) {
    uploadFile(files[index], index);
  }

  const hasFilesToUpload = files.some((f) => f.status === "idle");
  const isUploading = files.some((f) => f.status === "uploading");

  function getStatusBadge(status: string) {
    const styles = {
      uploaded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      indexed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status as keyof typeof styles] || styles.uploaded}`}>
        {status}
      </span>
    );
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Documents</h1>
      <p className="text-slate-400 mb-6 text-sm">
        Upload and manage your documents. Supported formats: PDF, DOCX, TXT.
      </p>

      <div
        className={`rounded-xl border-2 border-dashed p-8 mb-6 transition-colors ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-slate-700 bg-slate-900/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center gap-3 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
            📄
          </div>
          <span className="text-sm text-slate-300 font-medium">
            Drag & drop files here or click to choose
          </span>
          <span className="text-xs text-slate-500">
            PDF, DOCX, or TXT files (max 10MB each)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-200">
              Files ({files.length})
            </h2>
            {hasFilesToUpload && (
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 text-sm font-semibold transition-colors"
              >
                {isUploading ? "Uploading..." : "Upload All"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileUpload, index) => (
              <div
                key={`${fileUpload.file.name}-${index}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-200 truncate">
                      {fileUpload.file.name}
                    </span>
                    {fileUpload.status === "success" && (
                      <span className="text-xs text-emerald-400">✓</span>
                    )}
                    {fileUpload.status === "error" && (
                      <span className="text-xs text-red-400">✗</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {(fileUpload.file.size / 1024).toFixed(1)} KB
                    </span>
                    {fileUpload.status === "uploading" && (
                      <span className="text-slate-400">Uploading...</span>
                    )}
                    {fileUpload.status === "success" && (
                      <span className="text-emerald-400">
                        Uploaded successfully
                      </span>
                    )}
                    {fileUpload.status === "error" && (
                      <span className="text-red-400">
                        {fileUpload.error || "Upload failed"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {fileUpload.status === "idle" && (
                    <button
                      onClick={() => uploadFile(fileUpload, index)}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
                    >
                      Upload
                    </button>
                  )}
                  {fileUpload.status === "error" && (
                    <button
                      onClick={() => handleRetry(index)}
                      className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  {fileUpload.status !== "uploading" && (
                    <button
                      onClick={() => removeFile(index)}
                      className="w-6 h-6 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center justify-center"
                      title="Remove file"
                    >
                      ×
                    </button>
                  )}
                  {fileUpload.status === "uploading" && (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Uploaded Documents</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Title</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Size</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                    <td className="py-3 px-4 text-sm text-slate-200">{doc.title}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{doc.doc_type}</td>
                    <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{formatBytes(doc.size_bytes)}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{formatDate(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && documents.length === 0 && files.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No documents uploaded yet. Start by uploading your first document above.
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsContent />
    </ProtectedRoute>
  );
}
