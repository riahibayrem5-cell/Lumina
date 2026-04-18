// Curated public-domain classics shown by default and used as fast-path search results.
// All AI features now operate on slugs stored in the `books` table; this is bootstrap data.
// ~120 hand-picked Project Gutenberg titles spanning Romantic → Modernist eras.

export type BookEra = "Romantic" | "Victorian" | "Gothic" | "Edwardian" | "Modernist" | "Renaissance" | "Enlightenment" | "Ancient";
export type BookMood =
  | "Melancholic"
  | "Triumphant"
  | "Contemplative"
  | "Mysterious"
  | "Romantic"
  | "Adventurous"
  | "Comic"
  | "Tragic";

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
  // === Gothic & Horror ===
  { id: "frankenstein", title: "Frankenstein", author: "Mary Shelley", year: 1818, era: "Romantic", genre: ["Gothic", "Science Fiction", "Horror"], moods: ["Melancholic", "Mysterious"], hook: "A young scientist's hubris births a creature whose loneliness rivals our own.", gutenbergId: 84, coverIsbn: "9780486282114" },
  { id: "dracula", title: "Dracula", author: "Bram Stoker", year: 1897, era: "Victorian", genre: ["Gothic", "Horror", "Epistolary"], moods: ["Mysterious", "Adventurous"], hook: "Letters and journals trace a shadow moving from the Carpathians to London.", gutenbergId: 345 },
  { id: "dorian-gray", title: "The Picture of Dorian Gray", author: "Oscar Wilde", year: 1890, era: "Victorian", genre: ["Gothic", "Philosophical"], moods: ["Mysterious", "Melancholic"], hook: "Beauty preserved at terrible cost — a portrait that bears every sin.", gutenbergId: 174, coverIsbn: "9780141439570" },
  { id: "jekyll-and-hyde", title: "The Strange Case of Dr. Jekyll and Mr. Hyde", author: "Robert Louis Stevenson", year: 1886, era: "Victorian", genre: ["Gothic", "Horror", "Novella"], moods: ["Mysterious", "Tragic"], hook: "A respectable doctor's experiment unleashes the appetite he tried to bury.", gutenbergId: 43 },
  { id: "turn-of-the-screw", title: "The Turn of the Screw", author: "Henry James", year: 1898, era: "Victorian", genre: ["Gothic", "Novella", "Psychological"], moods: ["Mysterious", "Melancholic"], hook: "A governess at a country house — and the question of who, if anyone, is haunted.", gutenbergId: 209 },
  { id: "castle-of-otranto", title: "The Castle of Otranto", author: "Horace Walpole", year: 1764, era: "Enlightenment", genre: ["Gothic"], moods: ["Mysterious", "Tragic"], hook: "The first Gothic novel — a giant helmet, a doomed prince, a haunted castle.", gutenbergId: 696 },
  { id: "carmilla", title: "Carmilla", author: "J. Sheridan Le Fanu", year: 1872, era: "Victorian", genre: ["Gothic", "Horror", "Novella"], moods: ["Mysterious", "Romantic"], hook: "A vampire tale older than Dracula, languid and quietly devastating.", gutenbergId: 10007 },
  { id: "monk", title: "The Monk", author: "Matthew Lewis", year: 1796, era: "Romantic", genre: ["Gothic", "Horror"], moods: ["Mysterious", "Tragic"], hook: "A holy man's fall — sensational, blasphemous, and impossible to put down.", gutenbergId: 601 },

  // === Mystery & Detective ===
  { id: "sherlock-adventures", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", year: 1892, era: "Victorian", genre: ["Mystery", "Detective"], moods: ["Mysterious", "Adventurous"], hook: "A pipe, a violin, and a mind that bends London's fog into evidence.", gutenbergId: 1661 },
  { id: "study-in-scarlet", title: "A Study in Scarlet", author: "Arthur Conan Doyle", year: 1887, era: "Victorian", genre: ["Mystery", "Detective"], moods: ["Mysterious"], hook: "Holmes and Watson meet — and the game begins.", gutenbergId: 244 },
  { id: "hound-of-the-baskervilles", title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", year: 1902, era: "Edwardian", genre: ["Mystery", "Gothic"], moods: ["Mysterious", "Adventurous"], hook: "A spectral hound on the moor, and a logician determined to disprove it.", gutenbergId: 2852 },
  { id: "moonstone", title: "The Moonstone", author: "Wilkie Collins", year: 1868, era: "Victorian", genre: ["Mystery", "Detective"], moods: ["Mysterious"], hook: "T.S. Eliot called it the first and greatest English detective novel.", gutenbergId: 155 },
  { id: "woman-in-white", title: "The Woman in White", author: "Wilkie Collins", year: 1859, era: "Victorian", genre: ["Mystery", "Gothic"], moods: ["Mysterious", "Romantic"], hook: "A midnight encounter on a Hampstead road that unravels a sinister inheritance plot.", gutenbergId: 583 },
  { id: "mysterious-affair-styles", title: "The Mysterious Affair at Styles", author: "Agatha Christie", year: 1920, era: "Modernist", genre: ["Mystery", "Detective"], moods: ["Mysterious"], hook: "The debut of a small Belgian with extraordinary little grey cells.", gutenbergId: 863 },
  { id: "father-brown", title: "The Innocence of Father Brown", author: "G.K. Chesterton", year: 1911, era: "Edwardian", genre: ["Mystery", "Detective"], moods: ["Mysterious", "Contemplative"], hook: "A small Catholic priest who solves crimes by understanding sin from the inside.", gutenbergId: 204 },

  // === Romance & Comedy of Manners ===
  { id: "pride-and-prejudice", title: "Pride and Prejudice", author: "Jane Austen", year: 1813, era: "Romantic", genre: ["Romance", "Comedy of Manners"], moods: ["Romantic", "Triumphant", "Comic"], hook: "Wit, wealth, and wounded pride dance across English drawing rooms.", gutenbergId: 1342, coverIsbn: "9780141439518" },
  { id: "sense-and-sensibility", title: "Sense and Sensibility", author: "Jane Austen", year: 1811, era: "Romantic", genre: ["Romance", "Comedy of Manners"], moods: ["Romantic", "Contemplative"], hook: "Two sisters, two temperaments — and the cost of feeling too much or too little.", gutenbergId: 161 },
  { id: "emma", title: "Emma", author: "Jane Austen", year: 1815, era: "Romantic", genre: ["Romance", "Comedy of Manners"], moods: ["Comic", "Romantic"], hook: "A clever heiress meddles in everyone's love life but her own.", gutenbergId: 158 },
  { id: "persuasion", title: "Persuasion", author: "Jane Austen", year: 1817, era: "Romantic", genre: ["Romance"], moods: ["Romantic", "Melancholic"], hook: "Austen's quietest, most autumnal novel — a second chance after eight long years.", gutenbergId: 105 },
  { id: "mansfield-park", title: "Mansfield Park", author: "Jane Austen", year: 1814, era: "Romantic", genre: ["Romance", "Comedy of Manners"], moods: ["Contemplative", "Romantic"], hook: "A poor cousin grows up among rich relations and quietly outlasts them all.", gutenbergId: 141 },
  { id: "northanger-abbey", title: "Northanger Abbey", author: "Jane Austen", year: 1817, era: "Romantic", genre: ["Romance", "Satire"], moods: ["Comic", "Romantic"], hook: "A Gothic-novel-addicted heroine learns the difference between fiction and life.", gutenbergId: 121 },
  { id: "jane-eyre", title: "Jane Eyre", author: "Charlotte Brontë", year: 1847, era: "Victorian", genre: ["Romance", "Gothic", "Bildungsroman"], moods: ["Romantic", "Contemplative"], hook: "A governess of plain face and fierce conscience walks into a haunted house.", gutenbergId: 1260 },
  { id: "wuthering-heights", title: "Wuthering Heights", author: "Emily Brontë", year: 1847, era: "Victorian", genre: ["Gothic", "Romance"], moods: ["Melancholic", "Mysterious"], hook: "A love that scorches the moors and refuses, even in death, to lie still.", gutenbergId: 768 },
  { id: "tenant-of-wildfell-hall", title: "The Tenant of Wildfell Hall", author: "Anne Brontë", year: 1848, era: "Victorian", genre: ["Romance", "Social"], moods: ["Melancholic", "Triumphant"], hook: "A mysterious widow refuses to explain herself — and the village can't bear it.", gutenbergId: 969 },

  // === Dickens & Victorian social ===
  { id: "tale-of-two-cities", title: "A Tale of Two Cities", author: "Charles Dickens", year: 1859, era: "Victorian", genre: ["Historical", "Tragedy"], moods: ["Triumphant", "Melancholic"], hook: "It was the best of times. It was, of course, also the worst.", gutenbergId: 98 },
  { id: "great-expectations", title: "Great Expectations", author: "Charles Dickens", year: 1861, era: "Victorian", genre: ["Bildungsroman"], moods: ["Melancholic", "Contemplative"], hook: "A blacksmith's apprentice, a frozen wedding cake, and the price of becoming a gentleman.", gutenbergId: 1400 },
  { id: "oliver-twist", title: "Oliver Twist", author: "Charles Dickens", year: 1838, era: "Victorian", genre: ["Social"], moods: ["Tragic", "Triumphant"], hook: "Please, sir, I want some more — and the underworld of Victorian London answers.", gutenbergId: 730 },
  { id: "david-copperfield", title: "David Copperfield", author: "Charles Dickens", year: 1850, era: "Victorian", genre: ["Bildungsroman"], moods: ["Contemplative", "Triumphant"], hook: "Whether I shall turn out to be the hero of my own life — Dickens's favorite.", gutenbergId: 766 },
  { id: "bleak-house", title: "Bleak House", author: "Charles Dickens", year: 1853, era: "Victorian", genre: ["Mystery", "Social"], moods: ["Melancholic", "Mysterious"], hook: "Fog everywhere — and a Chancery suit slowly devouring everyone it touches.", gutenbergId: 1023 },
  { id: "christmas-carol", title: "A Christmas Carol", author: "Charles Dickens", year: 1843, era: "Victorian", genre: ["Novella", "Ghost"], moods: ["Triumphant", "Mysterious"], hook: "Three spirits, one miser, and the most famous redemption in English fiction.", gutenbergId: 46 },
  { id: "hard-times", title: "Hard Times", author: "Charles Dickens", year: 1854, era: "Victorian", genre: ["Social"], moods: ["Melancholic"], hook: "Facts, facts, facts — and the human cost of a town built on them.", gutenbergId: 786 },
  { id: "middlemarch", title: "Middlemarch", author: "George Eliot", year: 1871, era: "Victorian", genre: ["Realist", "Social"], moods: ["Contemplative", "Romantic"], hook: "A study of provincial life — and arguably the greatest English novel ever written.", gutenbergId: 145 },
  { id: "silas-marner", title: "Silas Marner", author: "George Eliot", year: 1861, era: "Victorian", genre: ["Realist"], moods: ["Melancholic", "Triumphant"], hook: "A miserly weaver loses his gold and finds a child on his hearth.", gutenbergId: 550 },
  { id: "mill-on-the-floss", title: "The Mill on the Floss", author: "George Eliot", year: 1860, era: "Victorian", genre: ["Bildungsroman"], moods: ["Tragic", "Romantic"], hook: "A girl too clever and too passionate for the small world that raised her.", gutenbergId: 6688 },
  { id: "tess-of-the-durbervilles", title: "Tess of the d'Urbervilles", author: "Thomas Hardy", year: 1891, era: "Victorian", genre: ["Tragedy", "Realist"], moods: ["Tragic", "Melancholic"], hook: "A pure woman, faithfully presented — and the world that refuses to let her be.", gutenbergId: 110 },
  { id: "far-from-the-madding-crowd", title: "Far from the Madding Crowd", author: "Thomas Hardy", year: 1874, era: "Victorian", genre: ["Romance", "Realist"], moods: ["Romantic", "Melancholic"], hook: "A spirited farmer, three suitors, and the slow turn of the seasons on Wessex downs.", gutenbergId: 27 },
  { id: "jude-the-obscure", title: "Jude the Obscure", author: "Thomas Hardy", year: 1895, era: "Victorian", genre: ["Tragedy"], moods: ["Tragic"], hook: "A stonemason dreams of Oxford. The world has other plans.", gutenbergId: 153 },
  { id: "return-of-the-native", title: "The Return of the Native", author: "Thomas Hardy", year: 1878, era: "Victorian", genre: ["Tragedy", "Romance"], moods: ["Melancholic", "Romantic"], hook: "Egdon Heath broods like a character. The lovers atop it cannot escape it.", gutenbergId: 122 },
  { id: "north-and-south", title: "North and South", author: "Elizabeth Gaskell", year: 1855, era: "Victorian", genre: ["Romance", "Social"], moods: ["Romantic", "Contemplative"], hook: "A southern parson's daughter meets a northern mill owner. Neither remains the same.", gutenbergId: 4276 },
  { id: "cranford", title: "Cranford", author: "Elizabeth Gaskell", year: 1853, era: "Victorian", genre: ["Comedy of Manners"], moods: ["Comic", "Contemplative"], hook: "The gentle, exquisitely observed life of a small English town governed by its ladies.", gutenbergId: 394 },
  { id: "vanity-fair", title: "Vanity Fair", author: "William Makepeace Thackeray", year: 1848, era: "Victorian", genre: ["Satire", "Social"], moods: ["Comic", "Tragic"], hook: "Becky Sharp, ruthless and irresistible, climbs Regency society by every available stair.", gutenbergId: 599 },
  { id: "way-of-all-flesh", title: "The Way of All Flesh", author: "Samuel Butler", year: 1903, era: "Edwardian", genre: ["Bildungsroman", "Satire"], moods: ["Contemplative"], hook: "A merciless dissection of Victorian family life, published only after the author's death.", gutenbergId: 2153 },

  // === American 19th century ===
  { id: "moby-dick", title: "Moby-Dick", author: "Herman Melville", year: 1851, era: "Romantic", genre: ["Adventure", "Tragedy", "Allegory"], moods: ["Contemplative", "Adventurous"], hook: "Call him Ishmael. Call the whale a god, a mirror, a wound.", gutenbergId: 2701 },
  { id: "bartleby", title: "Bartleby, the Scrivener", author: "Herman Melville", year: 1853, era: "Romantic", genre: ["Short Story"], moods: ["Melancholic", "Mysterious"], hook: "I would prefer not to. The four words that built modern alienation.", gutenbergId: 11231 },
  { id: "scarlet-letter", title: "The Scarlet Letter", author: "Nathaniel Hawthorne", year: 1850, era: "Romantic", genre: ["Tragedy", "Allegory"], moods: ["Melancholic", "Tragic"], hook: "A scarlet 'A' on the bodice — and a Puritan colony's appetite for shame.", gutenbergId: 25344 },
  { id: "house-of-seven-gables", title: "The House of the Seven Gables", author: "Nathaniel Hawthorne", year: 1851, era: "Romantic", genre: ["Gothic"], moods: ["Mysterious", "Melancholic"], hook: "A New England house cursed by an old crime — and the cousins still inside it.", gutenbergId: 77 },
  { id: "huck-finn", title: "Adventures of Huckleberry Finn", author: "Mark Twain", year: 1884, era: "Victorian", genre: ["Adventure", "Bildungsroman"], moods: ["Adventurous", "Comic"], hook: "A raft, a river, and a friendship that shames a nation's conscience.", gutenbergId: 76 },
  { id: "tom-sawyer", title: "The Adventures of Tom Sawyer", author: "Mark Twain", year: 1876, era: "Victorian", genre: ["Adventure", "Bildungsroman"], moods: ["Adventurous", "Comic"], hook: "A whitewashed fence, a graveyard at midnight, and the sweet tyranny of boyhood.", gutenbergId: 74 },
  { id: "connecticut-yankee", title: "A Connecticut Yankee in King Arthur's Court", author: "Mark Twain", year: 1889, era: "Victorian", genre: ["Satire", "Science Fiction"], moods: ["Comic", "Adventurous"], hook: "A 19th-century engineer wakes up in Camelot — and tries to industrialize it.", gutenbergId: 86 },
  { id: "little-women", title: "Little Women", author: "Louisa May Alcott", year: 1868, era: "Victorian", genre: ["Bildungsroman", "Romance"], moods: ["Romantic", "Triumphant"], hook: "The four March sisters become themselves — fiercely, separately, together.", gutenbergId: 514 },
  { id: "uncle-toms-cabin", title: "Uncle Tom's Cabin", author: "Harriet Beecher Stowe", year: 1852, era: "Victorian", genre: ["Social", "Tragedy"], moods: ["Tragic", "Triumphant"], hook: "The novel that, Lincoln joked, started a war.", gutenbergId: 203 },
  { id: "age-of-innocence", title: "The Age of Innocence", author: "Edith Wharton", year: 1920, era: "Modernist", genre: ["Romance", "Social"], moods: ["Melancholic", "Romantic"], hook: "Old New York's exquisite cage, and the woman who almost slipped its bars.", gutenbergId: 541 },
  { id: "house-of-mirth", title: "The House of Mirth", author: "Edith Wharton", year: 1905, era: "Edwardian", genre: ["Tragedy", "Social"], moods: ["Tragic", "Melancholic"], hook: "Lily Bart needs to marry well. Society watches her not quite manage it.", gutenbergId: 284 },
  { id: "ethan-frome", title: "Ethan Frome", author: "Edith Wharton", year: 1911, era: "Edwardian", genre: ["Tragedy", "Novella"], moods: ["Tragic", "Melancholic"], hook: "A Massachusetts winter, a loveless marriage, and one disastrous sled ride.", gutenbergId: 4517 },
  { id: "portrait-of-a-lady", title: "The Portrait of a Lady", author: "Henry James", year: 1881, era: "Victorian", genre: ["Realist", "Romance"], moods: ["Contemplative", "Tragic"], hook: "A young American heiress in Europe — free to choose, and choosing terribly.", gutenbergId: 2833 },
  { id: "daisy-miller", title: "Daisy Miller", author: "Henry James", year: 1878, era: "Victorian", genre: ["Novella"], moods: ["Romantic", "Tragic"], hook: "A bright American girl in Rome, mistaken for what she isn't, and punished for it.", gutenbergId: 208 },

  // === Adventure & sea ===
  { id: "treasure-island", title: "Treasure Island", author: "Robert Louis Stevenson", year: 1883, era: "Victorian", genre: ["Adventure"], moods: ["Adventurous"], hook: "Pieces of eight, a one-legged cook, and the map every child has dreamed of.", gutenbergId: 120 },
  { id: "kidnapped", title: "Kidnapped", author: "Robert Louis Stevenson", year: 1886, era: "Victorian", genre: ["Adventure"], moods: ["Adventurous"], hook: "A young heir, a Highland fugitive, and a flight across post-Jacobite Scotland.", gutenbergId: 421 },
  { id: "robinson-crusoe", title: "Robinson Crusoe", author: "Daniel Defoe", year: 1719, era: "Enlightenment", genre: ["Adventure"], moods: ["Adventurous", "Contemplative"], hook: "The original castaway — and a meditation on solitude disguised as a yarn.", gutenbergId: 521 },
  { id: "gullivers-travels", title: "Gulliver's Travels", author: "Jonathan Swift", year: 1726, era: "Enlightenment", genre: ["Satire", "Adventure"], moods: ["Comic", "Contemplative"], hook: "Tiny people, giants, talking horses — and a savage indictment of humanity itself.", gutenbergId: 829 },
  { id: "three-musketeers", title: "The Three Musketeers", author: "Alexandre Dumas", year: 1844, era: "Romantic", genre: ["Adventure", "Historical"], moods: ["Adventurous", "Romantic"], hook: "All for one, one for all — and rapiers drawn under the cardinal's nose.", gutenbergId: 1257 },
  { id: "count-of-monte-cristo", title: "The Count of Monte Cristo", author: "Alexandre Dumas", year: 1844, era: "Romantic", genre: ["Adventure", "Revenge"], moods: ["Adventurous", "Triumphant"], hook: "Wait, and hope — and then return as the most patient avenger in fiction.", gutenbergId: 1184 },
  { id: "around-the-world-80-days", title: "Around the World in Eighty Days", author: "Jules Verne", year: 1873, era: "Victorian", genre: ["Adventure", "Science Fiction"], moods: ["Adventurous", "Comic"], hook: "A wager, a punctilious gentleman, and the planet itself as racetrack.", gutenbergId: 103 },
  { id: "20000-leagues", title: "Twenty Thousand Leagues Under the Sea", author: "Jules Verne", year: 1870, era: "Victorian", genre: ["Adventure", "Science Fiction"], moods: ["Adventurous", "Mysterious"], hook: "Captain Nemo, the Nautilus, and the dark cathedral of the deep.", gutenbergId: 164 },
  { id: "journey-center-earth", title: "Journey to the Center of the Earth", author: "Jules Verne", year: 1864, era: "Victorian", genre: ["Adventure", "Science Fiction"], moods: ["Adventurous"], hook: "Down a volcanic chimney into a world Victorian science had not imagined.", gutenbergId: 18857 },
  { id: "white-fang", title: "White Fang", author: "Jack London", year: 1906, era: "Edwardian", genre: ["Adventure"], moods: ["Adventurous", "Melancholic"], hook: "A wolf-dog learns men, and what mercy is, in the Yukon's white silence.", gutenbergId: 910 },
  { id: "call-of-the-wild", title: "The Call of the Wild", author: "Jack London", year: 1903, era: "Edwardian", genre: ["Adventure", "Novella"], moods: ["Adventurous"], hook: "A stolen St. Bernard mix becomes the wolf his ancestors were.", gutenbergId: 215 },
  { id: "scarlet-pimpernel", title: "The Scarlet Pimpernel", author: "Baroness Orczy", year: 1905, era: "Edwardian", genre: ["Adventure", "Historical"], moods: ["Adventurous", "Romantic"], hook: "They seek him here, they seek him there — that demned elusive Pimpernel.", gutenbergId: 60 },
  { id: "prisoner-of-zenda", title: "The Prisoner of Zenda", author: "Anthony Hope", year: 1894, era: "Victorian", genre: ["Adventure", "Romance"], moods: ["Adventurous", "Romantic"], hook: "An Englishman, a kidnapped king, a body double — and a Ruritanian throne.", gutenbergId: 95 },
  { id: "king-solomons-mines", title: "King Solomon's Mines", author: "H. Rider Haggard", year: 1885, era: "Victorian", genre: ["Adventure"], moods: ["Adventurous"], hook: "The original lost-world novel: maps drawn in blood, jewels deeper than dreams.", gutenbergId: 2166 },
  { id: "she", title: "She", author: "H. Rider Haggard", year: 1887, era: "Victorian", genre: ["Adventure", "Fantasy"], moods: ["Mysterious", "Adventurous"], hook: "She-who-must-be-obeyed waits in a hidden African kingdom — for two thousand years.", gutenbergId: 3155 },

  // === Conrad, Forster, Edwardian ===
  { id: "heart-of-darkness", title: "Heart of Darkness", author: "Joseph Conrad", year: 1899, era: "Edwardian", genre: ["Novella", "Adventure"], moods: ["Mysterious", "Contemplative"], hook: "A river journey into colonial shadow — and the silence it leaves behind.", gutenbergId: 219 },
  { id: "lord-jim", title: "Lord Jim", author: "Joseph Conrad", year: 1900, era: "Edwardian", genre: ["Tragedy", "Adventure"], moods: ["Tragic", "Contemplative"], hook: "One cowardly second on a doomed steamer, and the rest of a life trying to undo it.", gutenbergId: 5658 },
  { id: "secret-agent", title: "The Secret Agent", author: "Joseph Conrad", year: 1907, era: "Edwardian", genre: ["Tragedy", "Political"], moods: ["Mysterious", "Tragic"], hook: "Anarchists, spies, and a London bombing plot rendered with surgical irony.", gutenbergId: 974 },
  { id: "room-with-a-view", title: "A Room with a View", author: "E.M. Forster", year: 1908, era: "Edwardian", genre: ["Romance", "Comedy of Manners"], moods: ["Romantic", "Comic"], hook: "Florence opens a window, and an English girl can never quite shut it again.", gutenbergId: 2641 },
  { id: "howards-end", title: "Howards End", author: "E.M. Forster", year: 1910, era: "Edwardian", genre: ["Romance", "Social"], moods: ["Contemplative", "Romantic"], hook: "Only connect — three families and the country house that binds them.", gutenbergId: 2946 },
  { id: "where-angels-fear-to-tread", title: "Where Angels Fear to Tread", author: "E.M. Forster", year: 1905, era: "Edwardian", genre: ["Comedy of Manners", "Tragedy"], moods: ["Comic", "Tragic"], hook: "The English go to Italy and discover, calamitously, that Italians have inner lives.", gutenbergId: 2447 },
  { id: "way-we-live-now", title: "The Way We Live Now", author: "Anthony Trollope", year: 1875, era: "Victorian", genre: ["Satire", "Social"], moods: ["Comic"], hook: "A foreign financier dazzles London. Trollope skewers everyone, gently and totally.", gutenbergId: 5231 },
  { id: "warden", title: "The Warden", author: "Anthony Trollope", year: 1855, era: "Victorian", genre: ["Social"], moods: ["Contemplative", "Comic"], hook: "A kindly clergyman caught between conscience and the calm cruelty of reform.", gutenbergId: 619 },

  // === Modernist & 20th c. ===
  { id: "great-gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, era: "Modernist", genre: ["Tragedy", "Literary Fiction"], moods: ["Melancholic", "Romantic"], hook: "Green light over dark water — the price of dreaming oneself into being.", gutenbergId: 64317 },
  { id: "this-side-of-paradise", title: "This Side of Paradise", author: "F. Scott Fitzgerald", year: 1920, era: "Modernist", genre: ["Bildungsroman"], moods: ["Romantic", "Melancholic"], hook: "Princeton, jazz, heartbreak — Fitzgerald's first declaration of a generation.", gutenbergId: 805 },
  { id: "metamorphosis", title: "The Metamorphosis", author: "Franz Kafka", year: 1915, era: "Modernist", genre: ["Absurdist", "Novella"], moods: ["Melancholic", "Contemplative"], hook: "Gregor Samsa wakes transformed — and the family must decide what love is for.", gutenbergId: 5200 },
  { id: "trial", title: "The Trial", author: "Franz Kafka", year: 1925, era: "Modernist", genre: ["Absurdist"], moods: ["Mysterious", "Tragic"], hook: "Someone must have slandered Josef K., for one morning he was arrested.", gutenbergId: 7849 },
  { id: "ulysses", title: "Ulysses", author: "James Joyce", year: 1922, era: "Modernist", genre: ["Literary Fiction"], moods: ["Contemplative"], hook: "One Dublin day, every interior weather of human consciousness.", gutenbergId: 4300 },
  { id: "portrait-artist", title: "A Portrait of the Artist as a Young Man", author: "James Joyce", year: 1916, era: "Modernist", genre: ["Bildungsroman"], moods: ["Contemplative"], hook: "Stephen Dedalus discovers art is the only country he can keep faith with.", gutenbergId: 4217 },
  { id: "dubliners", title: "Dubliners", author: "James Joyce", year: 1914, era: "Modernist", genre: ["Short Story"], moods: ["Melancholic", "Contemplative"], hook: "Fifteen quiet stories of paralysis, ending with the snow falling on the living and the dead.", gutenbergId: 2814 },
  { id: "sons-and-lovers", title: "Sons and Lovers", author: "D.H. Lawrence", year: 1913, era: "Modernist", genre: ["Bildungsroman"], moods: ["Romantic", "Tragic"], hook: "A coal town, a possessive mother, and a son trying to learn how to love a woman.", gutenbergId: 217 },
  { id: "women-in-love", title: "Women in Love", author: "D.H. Lawrence", year: 1920, era: "Modernist", genre: ["Romance"], moods: ["Romantic", "Contemplative"], hook: "Two sisters, two men, and Lawrence's relentless inquiry into what desire is for.", gutenbergId: 4240 },
  { id: "of-human-bondage", title: "Of Human Bondage", author: "W. Somerset Maugham", year: 1915, era: "Modernist", genre: ["Bildungsroman"], moods: ["Tragic", "Romantic"], hook: "A clubfoot, a ruinous love, and an austere search for meaning without God.", gutenbergId: 351 },

  // === Wells & early SF ===
  { id: "time-machine", title: "The Time Machine", author: "H.G. Wells", year: 1895, era: "Victorian", genre: ["Science Fiction", "Novella"], moods: ["Mysterious", "Melancholic"], hook: "Eight hundred thousand years on, the Eloi dance and the Morlocks wait below.", gutenbergId: 35 },
  { id: "war-of-the-worlds", title: "The War of the Worlds", author: "H.G. Wells", year: 1898, era: "Victorian", genre: ["Science Fiction"], moods: ["Mysterious", "Tragic"], hook: "The Martians had no use for our cities, but they noticed our blood.", gutenbergId: 36 },
  { id: "invisible-man-wells", title: "The Invisible Man", author: "H.G. Wells", year: 1897, era: "Victorian", genre: ["Science Fiction"], moods: ["Mysterious", "Tragic"], hook: "A scientist erases himself from sight — and discovers he cannot get back.", gutenbergId: 5230 },
  { id: "island-doctor-moreau", title: "The Island of Doctor Moreau", author: "H.G. Wells", year: 1896, era: "Victorian", genre: ["Science Fiction", "Horror"], moods: ["Mysterious", "Tragic"], hook: "On a Pacific island, a vivisectionist insists on making men out of beasts.", gutenbergId: 159 },
  { id: "first-men-in-the-moon", title: "The First Men in the Moon", author: "H.G. Wells", year: 1901, era: "Edwardian", genre: ["Science Fiction", "Adventure"], moods: ["Adventurous", "Mysterious"], hook: "An anti-gravity sphere, two Edwardian gentlemen, and the Selenites' hive.", gutenbergId: 1013 },

  // === Russians ===
  { id: "crime-and-punishment", title: "Crime and Punishment", author: "Fyodor Dostoevsky", year: 1866, era: "Victorian", genre: ["Psychological", "Tragedy"], moods: ["Tragic", "Contemplative"], hook: "An axe, a pawnbroker, and a student arguing himself into and out of murder.", gutenbergId: 2554 },
  { id: "brothers-karamazov", title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", year: 1880, era: "Victorian", genre: ["Philosophical", "Tragedy"], moods: ["Contemplative", "Tragic"], hook: "Three brothers, one murdered father, and every great question burning between them.", gutenbergId: 28054 },
  { id: "notes-from-underground", title: "Notes from Underground", author: "Fyodor Dostoevsky", year: 1864, era: "Victorian", genre: ["Philosophical", "Novella"], moods: ["Melancholic", "Contemplative"], hook: "I am a sick man… I am a spiteful man — modern alienation is born.", gutenbergId: 600 },
  { id: "idiot", title: "The Idiot", author: "Fyodor Dostoevsky", year: 1869, era: "Victorian", genre: ["Psychological"], moods: ["Tragic", "Contemplative"], hook: "A perfectly good man returns to St. Petersburg. The city has no idea what to do.", gutenbergId: 2638 },
  { id: "anna-karenina", title: "Anna Karenina", author: "Leo Tolstoy", year: 1877, era: "Victorian", genre: ["Realist", "Tragedy", "Romance"], moods: ["Tragic", "Romantic"], hook: "All happy families are alike — and Anna's, at the train platform, is not one.", gutenbergId: 1399 },
  { id: "war-and-peace", title: "War and Peace", author: "Leo Tolstoy", year: 1869, era: "Victorian", genre: ["Historical", "Realist"], moods: ["Contemplative", "Romantic"], hook: "Napoleon at the gates of Moscow, and five hundred private lives in his shadow.", gutenbergId: 2600 },
  { id: "death-of-ivan-ilyich", title: "The Death of Ivan Ilyich", author: "Leo Tolstoy", year: 1886, era: "Victorian", genre: ["Novella", "Philosophical"], moods: ["Tragic", "Contemplative"], hook: "A judge dies slowly and asks, finally, what his life was for.", gutenbergId: 887 },
  { id: "fathers-and-sons", title: "Fathers and Sons", author: "Ivan Turgenev", year: 1862, era: "Victorian", genre: ["Realist"], moods: ["Contemplative", "Tragic"], hook: "A nihilist comes home from university. Russia, and his father, recoil.", gutenbergId: 30723 },

  // === French ===
  { id: "madame-bovary", title: "Madame Bovary", author: "Gustave Flaubert", year: 1856, era: "Victorian", genre: ["Realist", "Tragedy"], moods: ["Tragic", "Romantic"], hook: "A provincial doctor's wife reads too many novels — and pays the full price.", gutenbergId: 2413 },
  { id: "les-miserables", title: "Les Misérables", author: "Victor Hugo", year: 1862, era: "Victorian", genre: ["Historical", "Social"], moods: ["Tragic", "Triumphant"], hook: "A loaf of bread, nineteen years in chains, and the long arc of redemption.", gutenbergId: 135 },
  { id: "hunchback-of-notre-dame", title: "The Hunchback of Notre-Dame", author: "Victor Hugo", year: 1831, era: "Romantic", genre: ["Historical", "Tragedy"], moods: ["Tragic", "Romantic"], hook: "Medieval Paris, a cathedral as protagonist, and love that shatters everything beneath it.", gutenbergId: 2610 },
  { id: "candide", title: "Candide", author: "Voltaire", year: 1759, era: "Enlightenment", genre: ["Satire", "Novella"], moods: ["Comic"], hook: "All is for the best in this best of all possible worlds. (It is not.)", gutenbergId: 19942 },

  // === Children's & fantasy ===
  { id: "alice-in-wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", year: 1865, era: "Victorian", genre: ["Fantasy", "Children's"], moods: ["Mysterious", "Comic"], hook: "Down the rabbit hole, where logic plays croquet with flamingos.", gutenbergId: 11 },
  { id: "through-the-looking-glass", title: "Through the Looking-Glass", author: "Lewis Carroll", year: 1871, era: "Victorian", genre: ["Fantasy", "Children's"], moods: ["Mysterious", "Comic"], hook: "Alice steps through the mirror onto a chessboard the size of a country.", gutenbergId: 12 },
  { id: "wind-in-the-willows", title: "The Wind in the Willows", author: "Kenneth Grahame", year: 1908, era: "Edwardian", genre: ["Fantasy", "Children's"], moods: ["Contemplative", "Adventurous"], hook: "Mole, Rat, Badger, and Toad — pastoral England as a small, perfect dream.", gutenbergId: 289 },
  { id: "wizard-of-oz", title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", year: 1900, era: "Edwardian", genre: ["Fantasy", "Children's"], moods: ["Adventurous"], hook: "A Kansas tornado, a road of yellow brick, and four pilgrims looking for what they already have.", gutenbergId: 55 },
  { id: "peter-pan", title: "Peter Pan", author: "J.M. Barrie", year: 1911, era: "Edwardian", genre: ["Fantasy", "Children's"], moods: ["Adventurous", "Melancholic"], hook: "Second star to the right, and straight on till morning.", gutenbergId: 16 },
  { id: "secret-garden", title: "The Secret Garden", author: "Frances Hodgson Burnett", year: 1911, era: "Edwardian", genre: ["Children's"], moods: ["Romantic", "Triumphant"], hook: "A locked garden, a lonely girl, and the slow, green return of life.", gutenbergId: 17396 },
  { id: "little-princess", title: "A Little Princess", author: "Frances Hodgson Burnett", year: 1905, era: "Edwardian", genre: ["Children's"], moods: ["Romantic", "Triumphant"], hook: "Even a princess, the girl insists, can sleep in an attic.", gutenbergId: 146 },
  { id: "anne-of-green-gables", title: "Anne of Green Gables", author: "L.M. Montgomery", year: 1908, era: "Edwardian", genre: ["Bildungsroman", "Children's"], moods: ["Romantic", "Comic"], hook: "Red-haired, talkative, and adopted by mistake — and Avonlea is never the same.", gutenbergId: 45 },
  { id: "black-beauty", title: "Black Beauty", author: "Anna Sewell", year: 1877, era: "Victorian", genre: ["Children's"], moods: ["Melancholic", "Triumphant"], hook: "The autobiography of a horse — and a quiet revolution in animal welfare.", gutenbergId: 271 },
  { id: "swiss-family-robinson", title: "The Swiss Family Robinson", author: "Johann David Wyss", year: 1812, era: "Romantic", genre: ["Adventure", "Children's"], moods: ["Adventurous"], hook: "Castaways with the world's most impressive packing list.", gutenbergId: 11707 },

  // === Poe & short fiction ===
  { id: "poe-tales", title: "The Works of Edgar Allan Poe", author: "Edgar Allan Poe", year: 1845, era: "Romantic", genre: ["Gothic", "Horror", "Short Story"], moods: ["Mysterious", "Melancholic"], hook: "The raven, the heart beneath the floorboards, the cask of Amontillado.", gutenbergId: 2147 },
  { id: "narrative-arthur-pym", title: "The Narrative of Arthur Gordon Pym", author: "Edgar Allan Poe", year: 1838, era: "Romantic", genre: ["Adventure", "Gothic"], moods: ["Mysterious", "Adventurous"], hook: "A nightmarish southern voyage — Poe's only novel, and his strangest work.", gutenbergId: 2149 },
  { id: "tales-of-mystery-imagination", title: "Tales of Mystery and Imagination", author: "Edgar Allan Poe", year: 1908, era: "Edwardian", genre: ["Gothic", "Short Story"], moods: ["Mysterious"], hook: "The canonical Poe collection — gothic, ratiocinative, gorgeously diseased.", gutenbergId: 25525 },
  { id: "rip-van-winkle", title: "The Legend of Sleepy Hollow & Rip Van Winkle", author: "Washington Irving", year: 1820, era: "Romantic", genre: ["Short Story", "Folk"], moods: ["Mysterious", "Comic"], hook: "A headless horseman, a twenty-year nap — American folklore's first masterworks.", gutenbergId: 41 },
  { id: "kim", title: "Kim", author: "Rudyard Kipling", year: 1901, era: "Edwardian", genre: ["Adventure"], moods: ["Adventurous", "Contemplative"], hook: "An Irish orphan and a Tibetan lama wander British India in the Great Game.", gutenbergId: 2226 },
  { id: "jungle-book", title: "The Jungle Book", author: "Rudyard Kipling", year: 1894, era: "Victorian", genre: ["Adventure", "Children's"], moods: ["Adventurous"], hook: "Mowgli, raised by wolves — and the Law of the Jungle that governs them all.", gutenbergId: 236 },

  // === Drama, philosophy, ancient ===
  { id: "importance-of-being-earnest", title: "The Importance of Being Earnest", author: "Oscar Wilde", year: 1895, era: "Victorian", genre: ["Drama", "Comedy of Manners"], moods: ["Comic"], hook: "A handbag, a country house, and the wittiest two-and-a-half hours in English.", gutenbergId: 844 },
  { id: "ideal-husband", title: "An Ideal Husband", author: "Oscar Wilde", year: 1895, era: "Victorian", genre: ["Drama"], moods: ["Comic", "Romantic"], hook: "A blackmail plot in Mayfair, dressed in epigrams sharp enough to cut.", gutenbergId: 885 },
  { id: "pygmalion", title: "Pygmalion", author: "George Bernard Shaw", year: 1913, era: "Edwardian", genre: ["Drama", "Comedy of Manners"], moods: ["Comic", "Romantic"], hook: "A phonetician bets he can pass a flower-girl off as a duchess. He wins. Sort of.", gutenbergId: 3825 },
  { id: "doll-house", title: "A Doll's House", author: "Henrik Ibsen", year: 1879, era: "Victorian", genre: ["Drama"], moods: ["Tragic", "Triumphant"], hook: "The slam of a door that ended the Victorian marriage play forever.", gutenbergId: 2542 },
  { id: "hedda-gabler", title: "Hedda Gabler", author: "Henrik Ibsen", year: 1890, era: "Victorian", genre: ["Drama"], moods: ["Tragic"], hook: "A general's daughter, married to the wrong man, with a pistol on the wall.", gutenbergId: 4093 },
  { id: "complete-shakespeare", title: "The Complete Works of William Shakespeare", author: "William Shakespeare", year: 1616, era: "Renaissance", genre: ["Drama"], moods: ["Tragic", "Comic"], hook: "Thirty-eight plays. A hundred and fifty-four sonnets. The English language, basically.", gutenbergId: 100 },
  { id: "republic", title: "The Republic", author: "Plato", year: -380, era: "Ancient", genre: ["Philosophy"], moods: ["Contemplative"], hook: "The cave, the philosopher-kings, and the trial of justice itself.", gutenbergId: 1497 },
  { id: "meditations", title: "Meditations", author: "Marcus Aurelius", year: 180, era: "Ancient", genre: ["Philosophy"], moods: ["Contemplative"], hook: "A Roman emperor's private notebook — and Stoicism's quiet, practical heart.", gutenbergId: 2680 },
  { id: "art-of-war", title: "The Art of War", author: "Sun Tzu", year: -500, era: "Ancient", genre: ["Philosophy", "Strategy"], moods: ["Contemplative"], hook: "The supreme art of war is to subdue the enemy without fighting.", gutenbergId: 132 },
  { id: "iliad", title: "The Iliad", author: "Homer", year: -750, era: "Ancient", genre: ["Epic"], moods: ["Tragic", "Adventurous"], hook: "The wrath of Achilles, ruinous, that brought countless griefs upon the Achaeans.", gutenbergId: 6130 },
  { id: "odyssey", title: "The Odyssey", author: "Homer", year: -750, era: "Ancient", genre: ["Epic", "Adventure"], moods: ["Adventurous"], hook: "Tell me, O Muse, of that ingenious hero who travelled far and wide.", gutenbergId: 1727 },
  { id: "divine-comedy", title: "The Divine Comedy", author: "Dante Alighieri", year: 1320, era: "Renaissance", genre: ["Epic", "Philosophy"], moods: ["Contemplative"], hook: "Midway in the journey of our life, I found myself in a dark wood.", gutenbergId: 8800 },
  { id: "don-quixote", title: "Don Quixote", author: "Miguel de Cervantes", year: 1605, era: "Renaissance", genre: ["Adventure", "Satire"], moods: ["Comic", "Melancholic"], hook: "A retired gentleman reads too many chivalric romances and rides out to repair the world.", gutenbergId: 996 },

  // === Poetry & essays ===
  { id: "leaves-of-grass", title: "Leaves of Grass", author: "Walt Whitman", year: 1855, era: "Romantic", genre: ["Poetry"], moods: ["Triumphant", "Contemplative"], hook: "I celebrate myself, and sing myself — America's barbaric yawp.", gutenbergId: 1322 },
  { id: "walden", title: "Walden", author: "Henry David Thoreau", year: 1854, era: "Romantic", genre: ["Essay", "Philosophy"], moods: ["Contemplative"], hook: "Two years at a pond — and the most enduring American argument for living deliberately.", gutenbergId: 205 },
  { id: "self-reliance", title: "Self-Reliance and Other Essays", author: "Ralph Waldo Emerson", year: 1841, era: "Romantic", genre: ["Essay", "Philosophy"], moods: ["Contemplative", "Triumphant"], hook: "Trust thyself: every heart vibrates to that iron string.", gutenbergId: 16643 },
  { id: "complete-poems-dickinson", title: "Poems by Emily Dickinson", author: "Emily Dickinson", year: 1890, era: "Victorian", genre: ["Poetry"], moods: ["Contemplative", "Melancholic"], hook: "Tell all the truth but tell it slant — three small volumes that cracked open American verse.", gutenbergId: 12242 },
  { id: "songs-of-innocence", title: "Songs of Innocence and of Experience", author: "William Blake", year: 1794, era: "Romantic", genre: ["Poetry"], moods: ["Contemplative", "Mysterious"], hook: "Tyger, tyger, burning bright — Blake's twin worlds of vision.", gutenbergId: 1934 },

  // === A few more notable novels ===
  { id: "vicar-of-wakefield", title: "The Vicar of Wakefield", author: "Oliver Goldsmith", year: 1766, era: "Enlightenment", genre: ["Comedy of Manners"], moods: ["Comic", "Tragic"], hook: "A country parson loses everything he loves, with the gentlest possible smile.", gutenbergId: 2667 },
  { id: "tristram-shandy", title: "The Life and Opinions of Tristram Shandy", author: "Laurence Sterne", year: 1759, era: "Enlightenment", genre: ["Comedy of Manners"], moods: ["Comic"], hook: "The most digressive, self-aware, and hilarious novel of the 18th century.", gutenbergId: 1079 },
  { id: "moll-flanders", title: "Moll Flanders", author: "Daniel Defoe", year: 1722, era: "Enlightenment", genre: ["Picaresque"], moods: ["Adventurous", "Comic"], hook: "Twelve years a whore, five times a wife, eight years a thief — and not yet sorry.", gutenbergId: 370 },
  { id: "evelina", title: "Evelina", author: "Fanny Burney", year: 1778, era: "Enlightenment", genre: ["Comedy of Manners", "Romance"], moods: ["Romantic", "Comic"], hook: "A country girl's bewildered debut in London — Austen's acknowledged grandmother.", gutenbergId: 6053 },
  { id: "cousin-bette", title: "Cousin Bette", author: "Honoré de Balzac", year: 1846, era: "Victorian", genre: ["Realist", "Tragedy"], moods: ["Tragic"], hook: "An aging spinster's slow, methodical revenge on the family that pitied her.", gutenbergId: 1726 },
  { id: "pere-goriot", title: "Père Goriot", author: "Honoré de Balzac", year: 1835, era: "Romantic", genre: ["Realist", "Tragedy"], moods: ["Tragic"], hook: "A father ruined by daughters who will not visit him, even at the end.", gutenbergId: 1237 },
  { id: "germinal", title: "Germinal", author: "Émile Zola", year: 1885, era: "Victorian", genre: ["Realist", "Social"], moods: ["Tragic", "Triumphant"], hook: "A coal strike in northern France — and the birth of a furious 20th century.", gutenbergId: 4367 },
  { id: "therese-raquin", title: "Thérèse Raquin", author: "Émile Zola", year: 1867, era: "Victorian", genre: ["Tragedy", "Psychological"], moods: ["Tragic"], hook: "Adultery, murder, and a haunted Parisian apartment that will not let anyone leave.", gutenbergId: 6626 },
  { id: "nostromo", title: "Nostromo", author: "Joseph Conrad", year: 1904, era: "Edwardian", genre: ["Political", "Adventure"], moods: ["Tragic", "Adventurous"], hook: "Silver mines, revolution, and a Latin American republic Conrad invented whole.", gutenbergId: 2021 },
  { id: "winesburg-ohio", title: "Winesburg, Ohio", author: "Sherwood Anderson", year: 1919, era: "Modernist", genre: ["Short Story"], moods: ["Melancholic", "Contemplative"], hook: "Twenty-two linked stories of a small Midwestern town and its quiet grotesques.", gutenbergId: 416 },
  { id: "main-street", title: "Main Street", author: "Sinclair Lewis", year: 1920, era: "Modernist", genre: ["Satire", "Social"], moods: ["Comic", "Melancholic"], hook: "A bright young wife tries to civilize Gopher Prairie. Gopher Prairie wins.", gutenbergId: 543 },
  { id: "babbitt", title: "Babbitt", author: "Sinclair Lewis", year: 1922, era: "Modernist", genre: ["Satire"], moods: ["Comic", "Melancholic"], hook: "The American booster, dissected — and quietly mourned.", gutenbergId: 1156 },
  { id: "souls-of-black-folk", title: "The Souls of Black Folk", author: "W.E.B. Du Bois", year: 1903, era: "Edwardian", genre: ["Essay", "Philosophy"], moods: ["Contemplative", "Triumphant"], hook: "The problem of the twentieth century is the problem of the color line.", gutenbergId: 408 },
  { id: "narrative-frederick-douglass", title: "Narrative of the Life of Frederick Douglass", author: "Frederick Douglass", year: 1845, era: "Romantic", genre: ["Autobiography"], moods: ["Tragic", "Triumphant"], hook: "Slavery written from inside it, in some of the clearest prose ever set down in English.", gutenbergId: 23 },
  { id: "incidents-slave-girl", title: "Incidents in the Life of a Slave Girl", author: "Harriet Jacobs", year: 1861, era: "Victorian", genre: ["Autobiography"], moods: ["Tragic", "Triumphant"], hook: "Seven years hidden in a crawlspace — a mother's memoir of fugitive freedom.", gutenbergId: 11030 },
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
