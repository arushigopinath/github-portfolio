export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-zinc-400">
          AI Portfolio Project
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Shelf Scanner
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          Scan a bookshelf, identify visible books, and get personalized reading
          recommendations based on your taste.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="/scan"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Try the Scanner
          </a>

          <a
            href="/"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900"
          >
            View Project
          </a>
        </div>
      </section>
    </main>
  );
}