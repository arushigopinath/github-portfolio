import ScanForm from "@/components/ScanForm";

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-400">
          Scan Bookshelf
        </p>

        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
          Upload a bookshelf photo
        </h1>

        <p className="mb-8 text-zinc-300">
          Upload an image, tell us what kinds of books you like, and get
          personalized recommendations.
        </p>

        <ScanForm />
      </div>
    </main>
  );
}