import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../utils/apiClient";

const toDate = (v) => {
  try { return new Date(v).toLocaleString(); } catch { return "—"; }
};
const getPhotoUrl = (p) => {
  if (!p) return "";
  return p.url || p.image || p.file || p.path || p.src || (typeof p === "string" ? p : "");
};

function Lightbox({ open, photos, start = 0, title, onClose }) {
  const [i, setI] = useState(start);
  useEffect(() => setI(start), [start]);
  if (!open) return null;

  const prev = (e) => { e.stopPropagation(); setI((x) => (x - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setI((x) => (x + 1) % photos.length); };

  const src = getPhotoUrl(photos[i]);

  return (
    <div style={lb.backdrop} onClick={onClose}>
      <div style={lb.wrap} onClick={(e) => e.stopPropagation()}>
        <div style={lb.topbar}>
          <div style={{ color: "#fff", opacity: 0.9 }}>{title}</div>
          <button onClick={onClose} style={lb.close}>✕</button>
        </div>
        <img alt="journal" src={src} style={lb.image} />
        {photos.length > 1 && (
          <>
            <button onClick={prev} style={{ ...lb.nav, left: 12 }}>‹</button>
            <button onClick={next} style={{ ...lb.nav, right: 12 }}>›</button>
          </>
        )}
        {photos.length > 1 && (
          <div style={lb.row}>
            {photos.map((p, idx) => (
              <img
                key={idx}
                onClick={() => setI(idx)}
                alt="thumb"
                src={getPhotoUrl(p)}
                style={{ ...lb.thumb, outline: idx === i ? "2px solid #2563eb" : "none" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */
const AllJournalEntries = () => {
  const navigate = useNavigate();

  const [journalEntries, setJournalEntries] = useState([]);
  const [itemsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [lightbox, setLightbox] = useState({ open: false, photos: [], start: 0, title: "" });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
      return;
    }
    fetchJournalEntries(currentPage);

  }, [currentPage, navigate]);

  const fetchJournalEntries = async (page) => {
    const limit = itemsPerPage;
    const offset = (page - 1) * limit;

    try {
      setLoading(true);
      const response = await apiClient.get("/journal/travel-journal/", { params: { limit, offset } });
      const results = response.data.results ?? [];

      const normalized = results.map((r) => ({
        ...r,
        photos: r.photos || r.images || r.image_set || [],
      }));

      setJournalEntries(normalized);
      setTotalPages(Math.max(1, Math.ceil((response.data.count ?? 0) / limit)));
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  };

  const openGallery = (entry, start = 0) =>
    setLightbox({ open: true, photos: entry.photos || [], start, title: entry.title });

  const empty = !loading && journalEntries.length === 0;

  return (
    <div style={ui.page}>
      {/* Top bar */}
      <div style={ui.headerBar}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <h1 style={ui.h1}>Your Entries</h1>
          <span style={ui.sub}>All your notes in one tidy grid.</span>
        </div>
        <Link to="/journal/add" style={ui.primaryBtn}>Add new entry</Link>
      </div>

      {/* Content */}
      <div style={ui.container}>
        {loading ? (
          <div style={ui.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={ui.skeleton} />
            ))}
          </div>
        ) : empty ? (
          <div style={ui.empty}>
            <h3 style={{ margin: 0 }}>No entries yet</h3>
            <p style={{ marginTop: 6, color: "#64748b" }}>
              Create your first note and attach photos from your trip.
            </p>
            <Link to="/journal/add" style={{ ...ui.primaryBtn, marginTop: 16 }}>Add new entry</Link>
          </div>
        ) : (
          <>
            <div style={ui.grid}>
              {journalEntries.map((entry) => {
                const cover = getPhotoUrl(entry.photos?.[0]);
                return (
                  <article key={entry.id} style={ui.card}>
                    {/* cover */}
                    {cover ? (
                      <button
                        onClick={() => openGallery(entry, 0)}
                        style={ui.coverBtn}
                        aria-label="Open gallery"
                      >
                        <img src={cover} alt="" style={ui.coverImg} />
                        {entry.photos?.length > 1 && (
                          <div style={ui.moreBadge}>+{entry.photos.length - 1}</div>
                        )}
                      </button>
                    ) : (
                      <div style={ui.coverFallback}>No photo</div>
                    )}

                    {/* body */}
                    <div style={ui.body}>
                      <h3 style={ui.title}>{entry.title}</h3>
                      <div style={ui.meta}>
                        {entry.trip ? (
                          <>
                            <span>Trip:&nbsp;</span>
                            <Link to={`/trips/${entry.trip}`} style={ui.link}>
                              {typeof entry.trip === "object" ? entry.trip.name : `#${entry.trip}`}
                            </Link>
                            <span style={{ opacity: 0.5 }}> · </span>
                          </>
                        ) : null}
                        <span>{toDate(entry.created || entry.date)}</span>
                      </div>

                      {entry.notes && (
                        <p style={ui.notes}>{entry.notes}</p>
                      )}

                      {/* thumbnails row */}
                      {entry.photos?.length > 1 && (
                        <div style={ui.thumbRow}>
                          {entry.photos.slice(1, 4).map((p, idx) => (
                            <img
                              key={idx}
                              onClick={() => openGallery(entry, idx + 1)}
                              alt="thumb"
                              src={getPhotoUrl(p)}
                              style={ui.thumb}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={ui.pagination}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      ...ui.pageBtn,
                      ...(currentPage === i + 1 ? ui.pageBtnActive : {}),
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Lightbox
        open={lightbox.open}
        photos={lightbox.photos}
        start={lightbox.start}
        title={lightbox.title}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};

/* ---------- styles ---------- */
const ui = {
  page: { minHeight: "100vh", background: "linear-gradient(#f8fafc, #ffffff)" },
  headerBar: {
    position: "sticky", top: 0, zIndex: 5,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 24px", borderBottom: "1px solid #e5e7eb",
    backdropFilter: "saturate(180%) blur(8px)", background: "rgba(255,255,255,0.8)"
  },
  h1: { margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2 },
  sub: { color: "#64748b", fontSize: 14 },
  primaryBtn: {
    height: 44, display: "inline-flex", alignItems: "center", padding: "0 16px",
    borderRadius: 12, background: "#2563eb", color: "#fff", textDecoration: "none",
    boxShadow: "0 6px 20px rgba(37,99,235,.25)"
  },
  container: { maxWidth: 1040, margin: "0 auto", padding: "24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  skeleton: {
    height: 320, borderRadius: 24,
    background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%)",
    backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite"
  },
  card: { display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", borderRadius: 24, background: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.03)" },
  coverBtn: { position: "relative", padding: 0, border: 0, background: "transparent", cursor: "pointer" },
  coverImg: { width: "100%", height: 180, objectFit: "cover", display: "block" },
  coverFallback: { height: 180, display: "grid", placeItems: "center", background: "#f1f5f9", color: "#94a3b8" },
  moreBadge: {
    position: "absolute", right: 8, bottom: 8, padding: "4px 8px", borderRadius: 9999,
    background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 12
  },
  body: { padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b" },
  notes: { margin: 0, marginTop: 6, color: "#0f172a", lineHeight: 1.55 },
  thumbRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 },
  thumb: { width: "100%", height: 72, objectFit: "cover", borderRadius: 12, cursor: "pointer" },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 600 },
  empty: {
    border: "2px dashed #e5e7eb", borderRadius: 24, background: "#fff",
    padding: 32, textAlign: "center"
  },
  pagination: { display: "flex", justifyContent: "center", marginTop: 24, gap: 8 },
  pageBtn: {
    padding: "8px 12px", borderRadius: 10, border: "1px solid #2563eb",
    background: "#fff", color: "#2563eb", cursor: "pointer"
  },
  pageBtnActive: { background: "#2563eb", color: "#fff" }
};

/* lightbox styles */
const lb = {
  backdrop: { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  wrap: { width: "min(100%, 1100px)" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  close: { background: "transparent", color: "#fff", border: 0, fontSize: 20, cursor: "pointer" },
  image: { width: "100%", maxHeight: "70vh", objectFit: "contain", background: "#000", borderRadius: 16, display: "block" },
  nav: { position: "absolute", top: "50%", transform: "translateY(-50%)", height: 40, width: 40, borderRadius: 9999, border: 0, cursor: "pointer", background: "rgba(255,255,255,.85)" },
  row: { display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 6 },
  thumb: { height: 64, width: 100, objectFit: "cover", borderRadius: 10, cursor: "pointer" }
};

export default AllJournalEntries;
