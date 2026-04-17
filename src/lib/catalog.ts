// Curated public-domain classics shown by default and used as fast-path search results.
// All AI features now operate on slugs stored in the `books` table; this is bootstrap data.

export type BookEra = "Romantic" | "Victorian" | "Gothic" | "Edwardian" | "Modernist";
export type BookMood =
  | "Melancholic"
  | "Triumphant"
  | "Contemplative"
  | "Mysterious"
  | "Romantic"
  | "Adventurous";

export interface Book {
  id: string; // slug
  title: string;
  author: string;
  year: number;
  era: BookEra;
  genre: string[];
  moods: BookMood[];
  hook: string;
  gutenbergId: number;
  coverIsbn?: string;
}

export const CATALOG: Book[] = [
  {
    id: "frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    year: 1818,
    era: "Romantic",
    genre: ["Gothic", "Science Fiction", "Horror"],
    moods: ["Melancholic", "Mysterious"],
    hook: "A young scientist's hubris births a creature whose loneliness rivals our own.",
    gutenbergId: 84,
    coverIsbn: "9780486282114",
  },
  {
    id: "pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: 1813,
    era: "Romantic",
    genre: ["Romance", "Comedy of Manners"],
    moods: ["Romantic", "Triumphant"],
    hook: "Wit, wealth, and wounded pride dance across English drawing rooms.",
    gutenbergId: 1342,
    coverIsbn: "9780141439518",
  },
  {
    id: "dorian-gray",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    year: 1890,
    era: "Victorian",
    genre: ["Gothic", "Philosophical"],
    moods: ["Mysterious", "Melancholic"],
    hook: "Beauty preserved at terrible cost — a portrait that bears every sin.",
    gutenbergId: 174,
    coverIsbn: "9780141439570",
  },
  {
    id: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    era: "Victorian",
    genre: ["Gothic", "Horror", "Epistolary"],
    moods: ["Mysterious", "Adventurous"],
    hook: "Letters and journals trace a shadow moving from the Carpathians to London.",
    gutenbergId: 345,
  },
  {
    id: "sherlock-adventures",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    year: 1892,
    era: "Victorian",
    genre: ["Mystery", "Detective"],
    moods: ["Mysterious", "Adventurous"],
    hook: "A pipe, a violin, and a mind that bends London's fog into evidence.",
    gutenbergId: 1661,
  },
  {
    id: "great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    era: "Modernist",
    genre: ["Tragedy", "Literary Fiction"],
    moods: ["Melancholic", "Romantic"],
    hook: "Green light over dark water — the price of dreaming oneself into being.",
    gutenbergId: 64317,
  },
  {
    id: "jane-eyre",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    year: 1847,
    era: "Victorian",
    genre: ["Romance", "Gothic", "Bildungsroman"],
    moods: ["Romantic", "Contemplative"],
    hook: "A governess of plain face and fierce conscience walks into a haunted house.",
    gutenbergId: 1260,
  },
  {
    id: "moby-dick",
    title: "Moby-Dick",
    author: "Herman Melville",
    year: 1851,
    era: "Romantic",
    genre: ["Adventure", "Tragedy", "Allegory"],
    moods: ["Contemplative", "Adventurous"],
    hook: "Call him Ishmael. Call the whale a god, a mirror, a wound.",
    gutenbergId: 2701,
  },
  {
    id: "wuthering-heights",
    title: "Wuthering Heights",
    author: "Emily Brontë",
    year: 1847,
    era: "Victorian",
    genre: ["Gothic", "Romance"],
    moods: ["Melancholic", "Mysterious"],
    hook: "A love that scorches the moors and refuses, even in death, to lie still.",
    gutenbergId: 768,
  },
  {
    id: "tale-of-two-cities",
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    year: 1859,
    era: "Victorian",
    genre: ["Historical", "Tragedy"],
    moods: ["Triumphant", "Melancholic"],
    hook: "It was the best of times. It was, of course, also the worst.",
    gutenbergId: 98,
  },
  {
    id: "metamorphosis",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    year: 1915,
    era: "Modernist",
    genre: ["Absurdist", "Novella"],
    moods: ["Melancholic", "Contemplative"],
    hook: "Gregor Samsa wakes transformed — and the family must decide what love is for.",
    gutenbergId: 5200,
  },
  {
    id: "heart-of-darkness",
    title: "Heart of Darkness",
    author: "Joseph Conrad",
    year: 1899,
    era: "Edwardian",
    genre: ["Novella", "Adventure"],
    moods: ["Mysterious", "Contemplative"],
    hook: "A river journey into colonial shadow — and the silence it leaves behind.",
    gutenbergId: 219,
  },
];

export function getBook(id: string): Book | undefined {
  return CATALOG.find((b) => b.id === id);
}

export function coverUrl(book: Book): string {
  if (book.coverIsbn) {
    return `https://covers.openlibrary.org/b/isbn/${book.coverIsbn}-L.jpg`;
  }
  return `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-L.jpg`;
}
