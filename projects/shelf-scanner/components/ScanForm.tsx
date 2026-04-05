"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type DetectedBook = {
  title: string;
  author: string;
  confidence: string;
};

type Recommendation = {
  title: string;
  author: string;
  reason: string;
};

type ScanResponse = {
  success: boolean;
  message: string;
  receivedData?: {
    imageName: string | null;
    imageType: string | null;
    imageSize: number | null;
    genres: string;
    authors: string;
    books: string;
    avoid: string;
  };
  analysis?: {
    imageQuality: string;
    notes: string;
    detectedBooks: DetectedBook[];
    recommendations: Recommendation[];
  };
};

const MAX_FILE_SIZE_MB = 5;

export default function ScanForm() {
  const [image, setImage] = useState<File | null>(null);
  const [genres, setGenres] = useState("");
  const [authors, setAuthors] = useState("");
  const [books, setBooks] = useState("");
  const [avoid, setAvoid] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState("");

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  const handleFileChange = (file: File | null) => {
    setError("");
    setResult(null);

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      setImage(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      setImage(null);
      return;
    }

    setImage(file);
  };

  const handleReset = () => {
    setImage(null);
    setGenres("");
    setAuthors("");
    setBooks("");
    setAvoid("");
    setResult(null);
    setError("");
  };

  const getConfidenceBadgeClasses = (confidence: string) => {
    const value = confidence.toLowerCase();

    if (value === "high") {
      return "bg-green-500/15 text-green-300 border-green-500/30";
    }

    if (value === "medium") {
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    }

    if (value === "low") {
      return "bg-red-500/15 text-red-300 border-red-500/30";
    }

    return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!image) {
      setError("Please upload a bookshelf image before scanning.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("genres", genres);
      formData.append("authors", authors);
      formData.append("books", books);
      formData.append("avoid", avoid);

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data: ScanResponse = await response.json();
      console.log("API response:", data);
      setResult(data);
    } catch (submitError) {
      console.error("Submit error:", submitError);
      setResult({
        success: false,
        message: "Something went wrong while submitting the form.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Bookshelf Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleFileChange(file);
              }}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
            />

            <p className="mt-2 text-xs text-zinc-500">
              Accepted: image files only, up to {MAX_FILE_SIZE_MB} MB.
            </p>

            {image && (
              <p className="mt-2 text-sm text-zinc-400">
                Selected file: {image.name}
              </p>
            )}

            {imagePreviewUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                <div className="relative h-72 w-full">
                  <Image
                    src={imagePreviewUrl}
                    alt="Bookshelf preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Favorite Genres
            </label>
            <input
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="e.g. mystery, thriller, fantasy"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Favorite Authors
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="e.g. Agatha Christie, Fredrik Backman"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Books You Loved
            </label>
            <textarea
              rows={4}
              value={books}
              onChange={(e) => setBooks(e.target.value)}
              placeholder="List 2 or 3 books you really enjoyed"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Genres to Avoid
            </label>
            <input
              type="text"
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
              placeholder="e.g. horror, self-help"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Scan Shelf"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </form>

        {result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Scan Result</h2>

                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Scan Again
                </button>
              </div>

              <p
                className={`mb-4 text-sm font-medium ${
                  result.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.message}
              </p>

              {result.receivedData && (
                <div className="space-y-3 text-sm text-zinc-300">
                  <p>
                    <span className="font-semibold text-white">Image:</span>{" "}
                    {result.receivedData.imageName || "No image selected"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Image Type:</span>{" "}
                    {result.receivedData.imageType || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Image Size:</span>{" "}
                    {result.receivedData.imageSize
                      ? `${(result.receivedData.imageSize / 1024).toFixed(2)} KB`
                      : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Genres:</span>{" "}
                    {result.receivedData.genres || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Authors:</span>{" "}
                    {result.receivedData.authors || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Books You Loved:</span>{" "}
                    {result.receivedData.books || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Genres to Avoid:</span>{" "}
                    {result.receivedData.avoid || "—"}
                  </p>
                </div>
              )}
            </div>

            {result.analysis && (
              <>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-semibold">Shelf Analysis</h3>
                  <p className="mb-2 text-sm text-zinc-300">
                    <span className="font-semibold text-white">Image Quality:</span>{" "}
                    {result.analysis.imageQuality}
                  </p>
                  <p className="text-sm text-zinc-400">{result.analysis.notes}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-semibold">Detected Books</h3>
                  <div className="space-y-4">
                    {result.analysis.detectedBooks.map((book, index) => (
                      <div
                        key={`${book.title}-${index}`}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{book.title}</p>
                            <p className="text-sm text-zinc-400">{book.author}</p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getConfidenceBadgeClasses(
                              book.confidence
                            )}`}
                          >
                            {book.confidence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-semibold">
                    Recommended For You
                  </h3>
                  <div className="space-y-4">
                    {result.analysis.recommendations.map((book, index) => (
                      <div
                        key={`${book.title}-${index}`}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                      >
                        <p className="font-semibold text-white">{book.title}</p>
                        <p className="text-sm text-zinc-400">{book.author}</p>
                        <p className="mt-2 text-sm text-zinc-300">{book.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[90%] max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />

            <h3 className="mb-2 text-xl font-semibold text-white">
              Analyzing your shelf...
            </h3>

            <p className="text-sm leading-6 text-zinc-400">
              Detecting visible books and preparing personalized recommendations.
            </p>
          </div>
        </div>
      )}
    </>
  );
}