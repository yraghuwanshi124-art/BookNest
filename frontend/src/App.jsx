import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["Fiction", "Science", "Technology", "Mystery", "Fantasy", "Biography", "Self-Help"];
const DEMO_BOOKS = [
  { _id: "demo-1", title: "The Midnight Library", author: "Matt Haig", category: "Fiction", description: "Between life and death there is a library, and within that library, the shelves go on forever.", addedBy: null, cover: "midnight" },
  { _id: "demo-2", title: "Atomic Habits", author: "James Clear", category: "Self-Help", description: "A practical guide to building good habits, breaking bad ones, and making small changes that compound.", addedBy: null, cover: "atomic" },
  { _id: "demo-3", title: "The Silent Patient", author: "Alex Michaelides", category: "Mystery", description: "A psychological mystery about a woman who stops speaking after a shocking act, and the therapist determined to understand why.", addedBy: null, cover: "silent" },
  { _id: "demo-4", title: "Sapiens", author: "Yuval Noah Harari", category: "Science", description: "A sweeping exploration of humankind: how we came to be, and where we may be going.", addedBy: null, cover: "sapiens" },
  { _id: "demo-5", title: "The Hobbit", author: "J. R. R. Tolkien", category: "Fantasy", description: "A quiet homebody is swept into an extraordinary journey full of danger, friendship and discovery.", addedBy: null, cover: "hobbit" },
  { _id: "demo-6", title: "Educated", author: "Tara Westover", category: "Biography", description: "A memoir about education, family, and the complicated journey of finding a place in the world.", addedBy: null, cover: "educated" },
];
const coverThemes = ["cover-ink", "cover-sage", "cover-clay", "cover-blue", "cover-plum", "cover-ochre"];
const getToken = () => localStorage.getItem("token") || "";
const getSavedUser = () => { try { return JSON.parse(localStorage.getItem("booknest-user") || "null"); } catch { return null; } };
const initials = (name = "Reader") => name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
const dateLabel = (date) => date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recently";

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h7" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    back: <><path d="M19 12H5M11 18l-6-6 6-6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.book}</svg>;
}

function BookCover({ book, large = false }) {
  const requestedTheme = String(book.cover || "");
  const theme = requestedTheme.startsWith("cover-") ? requestedTheme : coverThemes[(String(book._id || book.title).length + (book.title || "").charCodeAt(0)) % coverThemes.length];
  return <div className={`book-cover ${theme} ${large ? "book-cover-large" : ""}`} aria-label={`Cover art for ${book.title}`}>
    <span className="cover-kicker">{book.category || "BOOKNEST EDITION"}</span>
    <span className="cover-title">{book.title}</span>
    <span className="cover-rule" />
    <span className="cover-author">{book.author}</span>
    <span className="cover-mark">BN.</span>
  </div>;
}

function Stars({ value = 0, interactive = false, onChange }) {
  return <div className={`stars ${interactive ? "stars-interactive" : ""}`} role={interactive ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={`star ${n <= value ? "star-filled" : ""}`} disabled={!interactive} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}><Icon name="star" size={interactive ? 25 : 14} /></button>)}
  </div>;
}

function App() {
  const [page, setPage] = useState(() => window.location.hash.replace("#", "") || "home");
  const [books, setBooks] = useState([]);
  const [apiReady, setApiReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All genres");
  const [sort, setSort] = useState("newest");
  const [selectedBook, setSelectedBook] = useState(null);
  const [form, setForm] = useState({ title: "", author: "", category: "Fiction", description: "" });
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(getSavedUser);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem("booknest-wishlist") || "[]"); } catch { return []; } });
  const [mobileMenu, setMobileMenu] = useState(false);

  const go = useCallback((next, opts = {}) => {
    const hash = next === "home" ? "" : `#${next}`;
    if (opts.replace) window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${hash}`);
    else window.history.pushState({}, "", `${window.location.pathname}${window.location.search}${hash}`);
    setPage(next);
    setMobileMenu(false);
    if (next !== "details") setSelectedBook(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const sync = () => { setPage(window.location.hash.replace("#", "") || "home"); setMobileMenu(false); };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const loadBooks = useCallback(async () => {
    setLoadError("");
    try {
      const response = await fetch(`${API}/api/books`);
      if (!response.ok) throw new Error("The book service is not responding.");
      const data = await response.json();
      setBooks(Array.isArray(data) ? data : []);
      setApiReady(true);
    } catch {
      setBooks([]);
      setApiReady(false);
      setLoadError("Could not connect to the BookNest API. Start the backend to load your library.");
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);
  useEffect(() => { localStorage.setItem("booknest-wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const visibleBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = books.filter(book => {
      const matchesQuery = !needle || `${book.title} ${book.author} ${book.description || ""} ${book.category || ""}`.toLowerCase().includes(needle);
      return matchesQuery && (category === "All genres" || (book.category || "Fiction") === category);
    });
    if (sort === "title") result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "rating") result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    if (sort === "newest") result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return result;
  }, [books, query, category, sort]);

  const openBook = async (book) => {
    setSelectedBook(book);
    setPage("details");
    window.history.pushState({}, "", "#details");
    setReviews([]);
    setRatingSummary({ averageRating: 0, totalReviews: 0 });
    setRating(5);
    setComment("");
    setReviewError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (String(book._id).startsWith("demo-")) return;
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        fetch(`${API}/api/books/${book._id}/reviews`),
        fetch(`${API}/api/books/${book._id}/rating`),
      ]);
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (ratingRes.ok) setRatingSummary(await ratingRes.json());
    } catch { /* details remain usable if reviews cannot load */ }
  };

  const handleAddBook = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!getToken() || !user) { setAuthMode("login"); go("auth"); setAuthError("Please log in before adding a book."); return; }
    if (!form.title.trim() || !form.author.trim()) { setFormError("Please enter both the title and author."); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: form.title.trim(), author: form.author.trim(), description: form.description.trim(), category: form.category }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "We couldn't add this book.");
      const newBook = data.book || data;
      setBooks(previous => [newBook, ...previous]);
      setForm({ title: "", author: "", category: "Fiction", description: "" });
      setNotice("Your book has been added to the library.");
      go("explore");
    } catch (error) { setFormError(error.message || "Could not connect to the backend."); }
    finally { setBusy(false); }
  };

  const handleDeleteBook = async (book) => {
    if (!window.confirm(`Delete “${book.title}” from BookNest?`)) return;
    try {
      const response = await fetch(`${API}/api/books/${book._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed.");
      setBooks(previous => previous.filter(item => item._id !== book._id));
      setWishlist(previous => previous.filter(id => id !== book._id));
      setNotice("Book deleted.");
      if (selectedBook?._id === book._id) go("explore");
    } catch (error) { setNotice(error.message); }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      const endpoint = authMode === "signup" ? "signup" : "login";
      const payload = { email: authForm.email.trim().toLowerCase(), password: authForm.password };
      if (authMode === "signup") payload.name = authForm.name.trim();
      const response = await fetch(`${API}/api/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed.");
      if (authMode === "signup") {
        setAuthMode("login");
        setAuthForm({ name: "", email: payload.email, password: "" });
        setAuthError("Account created. Please log in with your new account.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("booknest-user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      setNotice(`Welcome to BookNest, ${data.user.name.split(" ")[0]}.`);
      go("explore");
    } catch (error) { setAuthError(error.message || "Could not connect to the backend."); }
    finally { setAuthBusy(false); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("booknest-user");
    setUser(null);
    setNotice("You have been signed out.");
    go("home");
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");
    if (!getToken() || !user) { setAuthMode("login"); go("auth"); setAuthError("Log in to share your review."); return; }
    if (!selectedBook || String(selectedBook._id).startsWith("demo-")) { setReviewError("Reviews are available for books saved in your library."); return; }
    if (!comment.trim()) { setReviewError("Add a few words about the book before submitting."); return; }
    setReviewBusy(true);
    try {
      const response = await fetch(`${API}/api/books/${selectedBook._id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ rating, comment: comment.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Review could not be submitted.");
      setComment("");
      setReviews(previous => [data.review, ...previous]);
      const r = await fetch(`${API}/api/books/${selectedBook._id}/rating`);
      if (r.ok) setRatingSummary(await r.json());
      setNotice("Your review has been published.");
    } catch (error) { setReviewError(error.message); }
    finally { setReviewBusy(false); }
  };
function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}
  const toggleWishlist = (book) => {
    if (String(book._id).startsWith("demo-")) { setNotice("Sign in and save books from your live library to build your wishlist."); return; }
    setWishlist(previous => previous.includes(book._id) ? previous.filter(id => id !== book._id) : [...previous, book._id]);
  };

  const myBooks = books.filter(book => user && String(book.addedBy || "") === String(user.id || user._id || ""));
  const savedBooks = books.filter(book => wishlist.includes(book._id));
  const isOwner = (book) => user && String(book.addedBy || "") === String(user.id || user._id || "");
  const bookCards = (list) => list.map((book, index) => <article className="book-card" key={book._id}>
    <button className="cover-button" onClick={() => openBook(book)} aria-label={`View ${book.title}`}><BookCover book={book} /></button>
    <div className="book-card-body">
      <div className="book-card-meta"><span className="genre-tag">{book.category || "Fiction"}</span><button className={`icon-button save-button ${wishlist.includes(book._id) ? "is-saved" : ""}`} onClick={() => toggleWishlist(book)} aria-label="Save to wishlist"><Icon name="heart" size={17} /></button></div>
      <button className="book-title-link" onClick={() => openBook(book)}>{book.title}</button>
      <p className="book-author">by {book.author}</p>
      <p className="book-description">{book.description || "A new addition to the BookNest community library."}</p>
      <div className="book-card-bottom"><span className="book-date">{dateLabel(book.createdAt)}</span><button className="text-link" onClick={() => openBook(book)}>Details <Icon name="arrow" size={14} /></button></div>
      {isOwner(book) && <button className="delete-link" onClick={() => handleDeleteBook(book)}><Icon name="trash" size={14} /> Delete your book</button>}
    </div>
  </article>);

  const displayBooks = books.length ? books : DEMO_BOOKS;
  const homePicks = displayBooks.slice(0, 3);
  const pageTitle = page === "my-books" ? "My contributions" : page === "wishlist" ? "Your reading list" : "Explore the library";

  return <div className="app-shell">
    <header className="site-header">
      <button className="brand" onClick={() => go("home")} aria-label="BookNest home"><span className="brand-mark"><Icon name="book" size={21} /></span><span>booknest<span className="brand-period">.</span><small>READ · REFLECT · REVIEW</small></span></button>
      <button className="mobile-menu-button" onClick={() => setMobileMenu(v => !v)} aria-label="Toggle navigation"><Icon name="menu" /></button>
      <nav className={`main-nav ${mobileMenu ? "nav-open" : ""}`} aria-label="Main navigation">
        <button className={page === "home" ? "nav-active" : ""} onClick={() => go("home")}>Home</button>
        <button className={page === "explore" ? "nav-active" : ""} onClick={() => go("explore")}>Explore books</button>
        <button className={page === "add" ? "nav-active" : ""} onClick={() => { if (!user) { setAuthMode("login"); go("auth"); } else go("add"); }}>Add a book</button>
      </nav>
      <div className="header-actions">{user ? <><button className="profile-chip" onClick={() => go("my-books")}><span className="avatar">{initials(user.name)}</span><span>{user.name.split(" ")[0]}</span></button><button className="header-icon" title="Wishlist" onClick={() => go("wishlist")}><Icon name="heart" /></button><button className="sign-in-button" onClick={logout}>Sign out</button></> : <><button className="sign-in-button" onClick={() => { setAuthMode("login"); go("auth"); }}>Log in</button><button className="primary-button small-button" onClick={() => { setAuthMode("signup"); go("auth"); }}>Join BookNest <Icon name="arrow" size={15} /></button></>}</div>
    </header>

    {notice && <div className="notice-bar"><Icon name="check" size={16} /> {notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><Icon name="close" size={15} /></button></div>}
    {!apiReady && loadError && <div className="api-warning"><strong>Library is offline.</strong> {loadError} <button onClick={loadBooks}>Retry</button></div>}

    {page === "home" && <main className="minimal-home">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> A HOME FOR EVERY STORY</span>
          <h1>Find your next<br /><em>favourite chapter.</em></h1>
          <p className="hero-description">Discover meaningful books, share thoughtful reviews, and find your next favourite story.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => go("explore")}>Explore the library <Icon name="arrow" size={17} /></button>
            <button className="quiet-button" onClick={() => { if (!user) { setAuthMode("signup"); go("auth"); } else go("add"); }}>{user ? "Share a book" : "Join the community"}</button>
          </div>
          <div className="hero-proof"><div className="proof-avatars"><span>R</span><span>A</span><span>M</span><span>+</span></div><p><strong>For readers, by readers.</strong><br />Your next chapter starts here.</p></div>
        </div>
        <div className="hero-art" aria-label="BookNest featured book artwork">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="hero-book hero-book-back"><BookCover book={{title:"The Art of Noticing",author:"Rob Walker",category:"ESSAYS",cover:"cover-clay"}} large /></div>
          <div className="hero-book hero-book-front"><BookCover book={{title:"A Life in Pages",author:"Stories for the curious",category:"BOOKNEST SELECT",cover:"cover-sage"}} large /></div>
          <div className="floating-note"><span className="note-star">✳</span><span><strong>For curious minds</strong><small>And stories that stay.</small></span></div>
          <span className="art-caption">YOUR NEXT CHAPTER STARTS HERE</span>
        </div>
      </section>
    </main>}

    {page === "explore" && <main className="page-main"><div className="page-intro"><span className="eyebrow">THE BOOKNEST COLLECTION</span><h1>Explore the <em>library.</em></h1><p>Find a new perspective, a new world, or a book that feels like it was written for you.</p><div className="library-count"><strong>{books.length}</strong> {books.length === 1 ? "book" : "books"} in the community library</div></div>
      <section className="library-toolbar"><label className="search-box"><Icon name="search" size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, authors, genres…" aria-label="Search books" /><kbd>⌕</kbd></label><div className="toolbar-selects"><label><Icon name="filter" size={16} /><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by genre"><option>All genres</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort books"><option value="newest">Recently added</option><option value="title">Title A–Z</option><option value="rating">Top rated</option></select></div></section>
      {visibleBooks.length ? <div className="book-grid">{bookCards(visibleBooks)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="book" size={28} /></span><h2>{books.length ? "No books match your search." : "The first page is yours to write."}</h2><p>{books.length ? "Try another title or change your genre filter." : "Sign in and add a book to start building the community library."}</p><button className="primary-button" onClick={() => { if (books.length) { setQuery(""); setCategory("All genres"); } else if (!user) { setAuthMode("signup"); go("auth"); } else go("add"); }}>{books.length ? "Clear search" : "Add the first book"} <Icon name="arrow" size={16} /></button></div>}
      <div className="library-footnote">Showing {visibleBooks.length} of {books.length} community {books.length === 1 ? "book" : "books"}{!books.length ? " · Sample titles are shown on the homepage only" : ""}</div>
    </main>}

    {page === "add" && <main className="page-main form-page"><button className="back-link" onClick={() => go("explore")}><Icon name="back" size={16} /> Back to the library</button><div className="form-layout"><div className="form-aside"><span className="eyebrow">PASS THE STORY ON</span><h1>Every great book<br />deserves <em>to be found.</em></h1><p>Add a title that stayed with you, changed your perspective, or deserves a spot on someone else's shelf.</p><div className="form-aside-quote">“A reader lives a thousand lives before he dies.”<small>— George R. R. Martin</small></div></div><form className="panel-form" onSubmit={handleAddBook}><div className="form-heading"><span className="form-icon"><Icon name="plus" size={20} /></span><div><h2>Add a book</h2><p>Share a new discovery with the community.</p></div></div><label>Book title <span>*</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Midnight Library" maxLength={140} required /></label><label>Author <span>*</span><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="e.g. Matt Haig" maxLength={100} required /></label><label>Genre<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label>Why should someone read it?<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A short description or what makes this book special…" rows={4} maxLength={1200} /></label>{formError && <p className="form-error">{formError}</p>}<button className="primary-button submit-button" disabled={busy}>{busy ? <><span className="spinner" /> Adding to the library…</> : <>Publish to the library <Icon name="arrow" size={16} /></>}</button><p className="form-privacy">Your contribution will be visible to all BookNest readers.</p></form></div></main>}

    {page === "auth" && <main className="auth-page"><div className="auth-art"><div className="auth-art-inner"><span className="eyebrow">A COMMUNITY OF READERS</span><h1>Some stories<br />are better <em>shared.</em></h1><p>Discover your next favourite. Leave a thoughtful review. Help someone else find a story worth their time.</p><div className="auth-mini-books"><BookCover book={{title:"The Quiet Hours",author:"A collection",category:"FICTION",cover:"cover-ink"}} /><BookCover book={{title:"New Perspectives",author:"For every reader",category:"ESSAYS",cover:"cover-ochre"}} /></div></div></div><div className="auth-form-side"><form className="auth-form" onSubmit={handleAuth}><span className="eyebrow">{authMode === "login" ? "WELCOME BACK" : "YOUR NEXT CHAPTER"}</span><h2>{authMode === "login" ? "Good to see you." : "Make yourself at home."}</h2><p>{authMode === "login" ? "Sign in to continue your reading journey." : "Create an account and join the conversation."}</p>{authMode === "signup" && <label>Your name<input value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="What should we call you?" autoComplete="name" maxLength={80} required /></label>}<label>Email address<input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder={authMode === "signup" ? "At least 8 characters" : "Enter your password"} autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={authMode === "signup" ? 8 : 1} required /></label>{authError && <p className={authError.startsWith("Account created") ? "form-success" : "form-error"}>{authError}</p>}<button className="primary-button auth-submit" disabled={authBusy}>{authBusy ? "One moment…" : authMode === "login" ? "Sign in to BookNest" : "Create my account"} <Icon name="arrow" size={16} /></button><p className="auth-switch">{authMode === "login" ? "New around here?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p><button type="button" className="back-link auth-back" onClick={() => go("home")}><Icon name="back" size={15} /> Back to home</button></form></div></main>}

    {page === "my-books" && <main className="page-main"><div className="page-intro"><span className="eyebrow">YOUR BOOKNEST ACTIVITY</span><h1>My <em>contributions.</em></h1><p>The books you've shared with the community.</p></div>{user ? myBooks.length ? <div className="book-grid">{bookCards(myBooks)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="book" size={28} /></span><h2>Your shelf is waiting.</h2><p>Books you add to the community will appear here.</p><button className="primary-button" onClick={() => go("add")}>Add a book <Icon name="arrow" size={16} /></button></div> : <div className="empty-state"><h2>Sign in to see your books.</h2><button className="primary-button" onClick={() => { setAuthMode("login"); go("auth"); }}>Log in <Icon name="arrow" size={16} /></button></div>}</main>}

    {page === "wishlist" && <main className="page-main"><div className="page-intro"><span className="eyebrow">KEEP IT CLOSE</span><h1>Your reading <em>list.</em></h1><p>Books you want to come back to.</p></div>{savedBooks.length ? <div className="book-grid">{bookCards(savedBooks)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="heart" size={28} /></span><h2>Save a story for later.</h2><p>Use the heart on a book card to keep your next read close at hand.</p><button className="primary-button" onClick={() => go("explore")}>Explore books <Icon name="arrow" size={16} /></button></div>}</main>}

    {page.startsWith("details") && selectedBook && <main className="page-main details-page"><button className="back-link" onClick={() => go("explore")}><Icon name="back" size={16} /> Back to all books</button><section className="detail-hero"><div className="detail-cover-wrap"><BookCover book={selectedBook} large /></div><div className="detail-copy"><span className="eyebrow">{selectedBook.category || "FICTION"} · BOOKNEST LIBRARY</span><h1>{selectedBook.title}</h1><p className="detail-author">by {selectedBook.author}</p><div className="rating-summary"><div><strong>{ratingSummary.averageRating ? Number(ratingSummary.averageRating).toFixed(1) : "—"}</strong><Stars value={Math.round(ratingSummary.averageRating || 0)} /></div><span>{ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? "review" : "reviews"}</span></div><p className="detail-description">{selectedBook.description || "A new addition to the BookNest community library. Discover what makes this story worth reading."}</p><div className="detail-actions"><button className="primary-button" onClick={() => { if (!user) { setAuthMode("login"); go("auth"); } else document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Write a review <Icon name="arrow" size={16} /></button><button className={`outline-button ${wishlist.includes(selectedBook._id) ? "outline-saved" : ""}`} onClick={() => toggleWishlist(selectedBook)}><Icon name="heart" size={16} /> {wishlist.includes(selectedBook._id) ? "Saved" : "Save for later"}</button></div><span className="added-date">Added {dateLabel(selectedBook.createdAt)}</span></div></section><section className="reviews-section"><div className="reviews-heading"><div><span className="eyebrow">READER NOTES</span><h2>Reviews & reflections</h2></div><span className="review-count">{ratingSummary.totalReviews} reviews</span></div><div className="reviews-layout"><form id="review-form" className="review-form" onSubmit={submitReview}><h3>Share your perspective</h3><p>Help another reader decide if this story is for them.</p><label>Your rating</label><Stars value={rating} interactive onChange={setRating} /><label htmlFor="review-comment">Your review</label><textarea id="review-comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="What stayed with you? What would you tell another reader?" rows={5} maxLength={1500} required /><span className="character-count">{comment.length}/1500</span>{reviewError && <p className="form-error">{reviewError}</p>}<button className="primary-button submit-button" disabled={reviewBusy}>{reviewBusy ? "Publishing…" : "Publish review"} <Icon name="arrow" size={15} /></button></form><div className="review-list">{reviews.length ? reviews.map(review => <article className="review-card" key={review._id}><div className="review-person"><span className="avatar">{initials(review.user?.name || "Reader")}</span><div><strong>{review.user?.name || "BookNest reader"}</strong><small>{dateLabel(review.createdAt)}</small></div><Stars value={review.rating} /></div><p>{review.comment}</p></article>) : <div className="review-empty"><span className="empty-icon"><Icon name="star" size={24} /></span><h3>Start the conversation.</h3><p>No reviews yet. Your thoughts could be the first to help another reader.</p></div>}</div></div></section></main>}

    <footer className="site-footer"><div className="footer-top"><button className="brand footer-brand" onClick={() => go("home")}><span className="brand-mark"><Icon name="book" size={19} /></span><span>booknest<span className="brand-period">.</span><small>READ · REFLECT · REVIEW</small></span></button><p>A little corner of the internet for people<br />who believe a good book can change a day.</p><button className="footer-explore" onClick={() => go("explore")}>Explore the library <Icon name="arrow" size={15} /></button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BookNest</span><span>Made for readers, by readers.</span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button></div></footer>
  </div>;
}

export default App;
