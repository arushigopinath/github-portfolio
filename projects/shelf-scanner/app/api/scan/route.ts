import { NextResponse } from "next/server";

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

function getMockResults(
  genres: string,
  authors: string,
  books: string,
  avoid: string
): {
  imageQuality: string;
  notes: string;
  detectedBooks: DetectedBook[];
  recommendations: Recommendation[];
} {
  const genreText = genres.toLowerCase();
  const authorText = authors.toLowerCase();
  const bookText = books.toLowerCase();
  const avoidText = avoid.toLowerCase();

  if (
    genreText.includes("comedy") ||
    genreText.includes("humor") ||
    authorText.includes("douglas adams") ||
    bookText.includes("hitchhiker")
  ) {
    return {
      imageQuality: "medium",
      notes:
        "This is a genre-based mock demo response based on comedy and humorous sci-fi preferences.",
      detectedBooks: [
        {
          title: "The Hitchhiker's Guide to the Galaxy",
          author: "Douglas Adams",
          confidence: "high",
        },
        {
          title: "Good Omens",
          author: "Neil Gaiman & Terry Pratchett",
          confidence: "medium",
        },
        {
          title: "Dirk Gently's Holistic Detective Agency",
          author: "Douglas Adams",
          confidence: "medium",
        },
      ],
      recommendations: [
        {
          title: "Guards! Guards!",
          author: "Terry Pratchett",
          reason: "A funny, clever pick with absurd humor and memorable characters.",
        },
        {
          title: "The Colour of Magic",
          author: "Terry Pratchett",
          reason: "Fits your interest in comedy with a playful and chaotic fantasy vibe.",
        },
        {
          title: "Red Dwarf: Infinity Welcomes Careful Drivers",
          author: "Grant Naylor",
          reason: "A strong match if you enjoy humorous sci-fi like Douglas Adams.",
        },
      ],
    };
  }

  if (
    genreText.includes("mystery") ||
    genreText.includes("thriller") ||
    genreText.includes("detective") ||
    authorText.includes("agatha christie")
  ) {
    return {
      imageQuality: "medium",
      notes:
        "This is a genre-based mock demo response based on mystery and thriller preferences.",
      detectedBooks: [
        {
          title: "The Silent Patient",
          author: "Alex Michaelides",
          confidence: "high",
        },
        {
          title: "And Then There Were None",
          author: "Agatha Christie",
          confidence: "high",
        },
        {
          title: "The Midnight Library",
          author: "Matt Haig",
          confidence: "medium",
        },
      ],
      recommendations: [
        {
          title: "The Guest List",
          author: "Lucy Foley",
          reason: "Matches your interest in suspenseful mystery stories.",
        },
        {
          title: "The Thursday Murder Club",
          author: "Richard Osman",
          reason: "A lighter mystery choice with strong characters and humor.",
        },
        {
          title: "The Paris Apartment",
          author: "Lucy Foley",
          reason: "Fits the thriller tone from your reading preferences.",
        },
      ],
    };
  }

  if (
    genreText.includes("fantasy") ||
    genreText.includes("magic") ||
    genreText.includes("adventure")
  ) {
    return {
      imageQuality: "medium",
      notes:
        "This is a genre-based mock demo response based on fantasy and adventure preferences.",
      detectedBooks: [
        {
          title: "The Name of the Wind",
          author: "Patrick Rothfuss",
          confidence: "high",
        },
        {
          title: "Harry Potter and the Sorcerer's Stone",
          author: "J.K. Rowling",
          confidence: "medium",
        },
        {
          title: "The Hobbit",
          author: "J.R.R. Tolkien",
          confidence: "high",
        },
      ],
      recommendations: [
        {
          title: "Mistborn",
          author: "Brandon Sanderson",
          reason: "A strong fantasy pick with worldbuilding and momentum.",
        },
        {
          title: "A Wizard of Earthsea",
          author: "Ursula K. Le Guin",
          reason: "Great if you enjoy magic, classic fantasy, and rich atmosphere.",
        },
        {
          title: "The Lies of Locke Lamora",
          author: "Scott Lynch",
          reason: "Blends fantasy, adventure, and smart character-driven storytelling.",
        },
      ],
    };
  }

  if (
    genreText.includes("romance") ||
    genreText.includes("love") ||
    genreText.includes("relationship")
  ) {
    return {
      imageQuality: "medium",
      notes:
        "This is a genre-based mock demo response based on romance-focused preferences.",
      detectedBooks: [
        {
          title: "Book Lovers",
          author: "Emily Henry",
          confidence: "medium",
        },
        {
          title: "Beach Read",
          author: "Emily Henry",
          confidence: "medium",
        },
        {
          title: "The Love Hypothesis",
          author: "Ali Hazelwood",
          confidence: "high",
        },
      ],
      recommendations: [
        {
          title: "People We Meet on Vacation",
          author: "Emily Henry",
          reason: "A strong fit if you like witty romance and emotional chemistry.",
        },
        {
          title: "Love, Theoretically",
          author: "Ali Hazelwood",
          reason: "Matches modern romance with humor and academic energy.",
        },
        {
          title: "Part of Your World",
          author: "Abby Jimenez",
          reason: "A warm, character-driven romance recommendation.",
        },
      ],
    };
  }

  const safeAvoid = avoidText.trim();

  return {
    imageQuality: "medium",
    notes:
      safeAvoid.length > 0
        ? `This is a genre-based mock demo response. It also tried to avoid: ${avoid}.`
        : "This is a genre-based mock demo response based on the information you entered.",
    detectedBooks: [
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        confidence: "medium",
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        confidence: "low",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        confidence: "medium",
      },
    ],
    recommendations: [
      {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        reason: "A broad recommendation with strong reader appeal across genres.",
      },
      {
        title: "Anxious People",
        author: "Fredrik Backman",
        reason: "Good for readers who enjoy character-driven and accessible stories.",
      },
      {
        title: "Piranesi",
        author: "Susanna Clarke",
        reason: "A unique recommendation when your preferences are more mixed.",
      },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image") as File | null;
    const genres = (formData.get("genres") as string) || "";
    const authors = (formData.get("authors") as string) || "";
    const books = (formData.get("books") as string) || "";
    const avoid = (formData.get("avoid") as string) || "";

    console.log("Received scan request:");
    console.log("Image name:", image?.name || null);
    console.log("Image type:", image?.type || null);
    console.log("Image size:", image?.size || null);
    console.log("Genres:", genres);
    console.log("Authors:", authors);
    console.log("Books:", books);
    console.log("Avoid:", avoid);

    const analysis = getMockResults(genres, authors, books, avoid);

    return NextResponse.json({
      success: true,
      message: "Mock shelf analysis generated successfully.",
      receivedData: {
        imageName: image?.name || null,
        imageType: image?.type || null,
        imageSize: image?.size || null,
        genres,
        authors,
        books,
        avoid,
      },
      analysis,
    });
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while processing the scan request",
      },
      { status: 500 }
    );
  }
}