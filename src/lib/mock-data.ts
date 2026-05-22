export type Subject = { slug: string; name: string; icon: string; count: number; color: string };
export type University = { slug: string; name: string; short: string };
export type Note = {
  id: string;
  title: string;
  subject: string;
  subjectSlug: string;
  university: string;
  author: string;
  authorAvatar?: string;
  pages: number;
  downloads: number;
  rating: number;
  price: number; // 0 = free
  premium: boolean;
  cover: string; // gradient class
  preview: string;
  tags: string[];
};
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  cover: string;
};

export const subjects: Subject[] = [
  { slug: "cse", name: "Computer Science", icon: "Code2", count: 1240, color: "from-blue-500 to-indigo-600" },
  { slug: "eee", name: "Electrical Engineering", icon: "Cpu", count: 820, color: "from-sky-500 to-blue-600" },
  { slug: "math", name: "Mathematics", icon: "Sigma", count: 960, color: "from-indigo-500 to-violet-600" },
  { slug: "physics", name: "Physics", icon: "Atom", count: 540, color: "from-cyan-500 to-blue-600" },
  { slug: "chemistry", name: "Chemistry", icon: "FlaskConical", count: 410, color: "from-blue-400 to-indigo-500" },
  { slug: "business", name: "Business Studies", icon: "Briefcase", count: 780, color: "from-violet-500 to-blue-600" },
  { slug: "economics", name: "Economics", icon: "TrendingUp", count: 520, color: "from-blue-600 to-cyan-500" },
  { slug: "english", name: "English", icon: "BookOpen", count: 690, color: "from-indigo-400 to-blue-500" },
];

export const universities: University[] = [
  { slug: "du", name: "University of Dhaka", short: "DU" },
  { slug: "buet", name: "Bangladesh University of Engineering & Technology", short: "BUET" },
  { slug: "nsu", name: "North South University", short: "NSU" },
  { slug: "bracu", name: "BRAC University", short: "BRACU" },
  { slug: "ju", name: "Jahangirnagar University", short: "JU" },
  { slug: "cu", name: "University of Chittagong", short: "CU" },
  { slug: "ruet", name: "RUET", short: "RUET" },
  { slug: "kuet", name: "KUET", short: "KUET" },
];

const covers = [
  "from-blue-500 via-indigo-500 to-violet-600",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-indigo-400 via-blue-500 to-cyan-500",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-violet-500 via-blue-500 to-sky-500",
  "from-blue-600 via-indigo-600 to-blue-400",
];

export const notes: Note[] = [
  {
    id: "n1",
    title: "Data Structures & Algorithms — Complete Handwritten Notes",
    subject: "Computer Science",
    subjectSlug: "cse",
    university: "BUET",
    author: "Tanvir Ahmed",
    pages: 142,
    downloads: 3420,
    rating: 4.9,
    price: 0,
    premium: false,
    cover: covers[0],
    preview: "Comprehensive coverage of arrays, linked lists, trees, graphs, DP and algorithm analysis with worked examples.",
    tags: ["DSA", "Algorithms", "CSE-201"],
  },
  {
    id: "n2",
    title: "Calculus II — Integral Calculus Master Notes",
    subject: "Mathematics",
    subjectSlug: "math",
    university: "DU",
    author: "Nusrat Jahan",
    pages: 98,
    downloads: 2110,
    rating: 4.8,
    price: 149,
    premium: true,
    cover: covers[1],
    preview: "Definite & indefinite integrals, techniques of integration, applications and 300+ practice problems.",
    tags: ["Calculus", "Math-102"],
  },
  {
    id: "n3",
    title: "Microeconomics Principles — Lecture Compilation",
    subject: "Economics",
    subjectSlug: "economics",
    university: "NSU",
    author: "Rafi Hasan",
    pages: 76,
    downloads: 980,
    rating: 4.6,
    price: 99,
    premium: true,
    cover: covers[2],
    preview: "Supply, demand, elasticity, market structures and consumer theory simplified for finals.",
    tags: ["ECO-101"],
  },
  {
    id: "n4",
    title: "Organic Chemistry — Reactions & Mechanisms",
    subject: "Chemistry",
    subjectSlug: "chemistry",
    university: "DU",
    author: "Sadia Karim",
    pages: 120,
    downloads: 1540,
    rating: 4.7,
    price: 0,
    premium: false,
    cover: covers[3],
    preview: "Functional groups, named reactions, arrow-pushing mechanisms with practice problems.",
    tags: ["Organic", "CHEM-201"],
  },
  {
    id: "n5",
    title: "Digital Logic Design — Full Course Notes",
    subject: "Electrical Engineering",
    subjectSlug: "eee",
    university: "BUET",
    author: "Imran Chowdhury",
    pages: 110,
    downloads: 1820,
    rating: 4.8,
    price: 129,
    premium: true,
    cover: covers[4],
    preview: "Boolean algebra, K-maps, combinational and sequential circuits, FSM design and Verilog basics.",
    tags: ["DLD", "EEE-205"],
  },
  {
    id: "n6",
    title: "Business Communication — Cheat Sheets",
    subject: "Business Studies",
    subjectSlug: "business",
    university: "BRACU",
    author: "Mehjabin Rahman",
    pages: 42,
    downloads: 760,
    rating: 4.5,
    price: 49,
    premium: true,
    cover: covers[5],
    preview: "Email etiquette, report writing, presentations and case study frameworks for ENG-103.",
    tags: ["Business", "ENG-103"],
  },
  {
    id: "n7",
    title: "Physics I — Mechanics & Waves",
    subject: "Physics",
    subjectSlug: "physics",
    university: "JU",
    author: "Arif Hossain",
    pages: 88,
    downloads: 1320,
    rating: 4.6,
    price: 0,
    premium: false,
    cover: covers[0],
    preview: "Kinematics, dynamics, energy, momentum, oscillations and wave mechanics with solved problems.",
    tags: ["PHY-101"],
  },
  {
    id: "n8",
    title: "Operating Systems — Concepts & Practice",
    subject: "Computer Science",
    subjectSlug: "cse",
    university: "NSU",
    author: "Zara Islam",
    pages: 134,
    downloads: 2890,
    rating: 4.9,
    price: 199,
    premium: true,
    cover: covers[2],
    preview: "Processes, threads, scheduling, memory management, file systems and concurrency primitives.",
    tags: ["OS", "CSE-323"],
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "study-smarter-not-harder",
    title: "How to Study Smarter, Not Harder: 7 Science-Backed Tips",
    excerpt: "Cut your study time in half with these evidence-based learning techniques used by top students.",
    author: "NotesKhuji Team",
    date: "May 12, 2026",
    readTime: "6 min",
    category: "Study Tips",
    cover: covers[0],
  },
  {
    slug: "best-cse-resources-bangladesh",
    title: "Best CSE Resources for Bangladeshi University Students in 2026",
    excerpt: "From DSA to system design — a curated list of free and premium resources tailored for BUET, DU and NSU students.",
    author: "Tanvir Ahmed",
    date: "May 03, 2026",
    readTime: "9 min",
    category: "Resources",
    cover: covers[1],
  },
  {
    slug: "ace-your-finals",
    title: "The Ultimate 30-Day Plan to Ace Your Finals",
    excerpt: "A week-by-week revision blueprint that actually works, with templates you can download today.",
    author: "Nusrat Jahan",
    date: "Apr 21, 2026",
    readTime: "8 min",
    category: "Exam Prep",
    cover: covers[2],
  },
  {
    slug: "selling-notes-online",
    title: "How Students in Bangladesh Are Earning by Selling Notes Online",
    excerpt: "Real stories of students turning their lecture notes into a steady side income on NotesKhuji.",
    author: "Rafi Hasan",
    date: "Apr 10, 2026",
    readTime: "5 min",
    category: "Earnings",
    cover: covers[3],
  },
];

export const testimonials = [
  {
    name: "Ayesha Siddika",
    role: "CSE Student, BUET",
    text: "NotesKhuji saved my semester. The DSA notes are gold — concise, well-structured, and exam-focused.",
  },
  {
    name: "Mahir Tajwar",
    role: "EEE Student, RUET",
    text: "I uploaded my DLD notes and earned enough in 2 months to cover my hostel fees. Game changer.",
  },
  {
    name: "Tasnia Rahman",
    role: "Business Student, NSU",
    text: "Beautiful interface, fast downloads, and quality is verified. Easily the best notes platform for BD students.",
  },
];
