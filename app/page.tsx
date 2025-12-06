
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="max-w-xl text-center px-4">
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Shaastra AI Assistant
        </h1>
        <p className="text-slate-300 mb-6">
          Upload your Irish legal and official documents, ask questions in simple English,
          and let AI explain what they mean and what you need to do next.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-slate-950"
          >
            Get started
          </Link>
          <Link
            href="/documents"
            className="px-4 py-2 rounded-lg border border-slate-500 hover:border-emerald-400 hover:text-emerald-200 text-sm font-medium"
          >
            Upload documents
          </Link>
        </div>
      </div>
    </main>
  );
}
