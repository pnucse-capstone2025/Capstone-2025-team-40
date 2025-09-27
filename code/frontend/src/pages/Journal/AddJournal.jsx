import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import "../../styles/journal.css";



function toTagArray(s) {
  if (Array.isArray(s)) return s;
  return (s || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function Section({ title, subtitle, right, children }) {
  return (
    <section className="sec">
      <div className="sec__head">
        <div>
          <h2 className="sec__title">{title}</h2>
          {subtitle && <p className="sec__subtitle">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="field__control">{children}</div>
      {hint && <p className="field__hint">{hint}</p>}
    </label>
  );
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const classes = ["btn"];
  if (variant === "primary") classes.push("btn--primary");
  if (variant === "secondary") classes.push("btn--secondary");
  if (variant === "subtle") classes.push("btn--subtle");
  if (variant === "danger") classes.push("btn--danger");
  if (className) classes.push(className);
  return (
    <button className={classes.join(" ")} {...props}>
      {children}
    </button>
  );
}

function TextInput(props) {
  return <input {...props} className={["input", props.className].filter(Boolean).join(" ")} />;
}
function Textarea(props) {
  return <textarea {...props} className={["textarea", props.className].filter(Boolean).join(" ")} />;
}

export default function Addjounal() {
  
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("journal-page");
    return () => document.body.classList.remove("journal-page");
  }, []);

  // -----------------
  // Journals state
  // -----------------
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState(null);

  // inline edit states for a journal card
  const [editingJid, setEditingJid] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/journal/travel-journal/");
      setJournals(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        navigate("/signin");
        return;
      }
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createJournal(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { title, notes, tags: toTagArray(tagsInput) };
      await apiClient.post("/journal/travel-journal/", payload);
      setTitle(""); setNotes(""); setTagsInput("");
      await load();
    } catch (e) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    }
  }

  // Edit/Delete journal
  function startJournalEdit(j) {
    setEditingJid(j.id);
    setEditTitle(j.title || "");
    setEditNotes(j.notes || "");
    setEditTags(Array.isArray(j.tags) ? j.tags.join(", ") : j.tags || "");
  }
  function cancelJournalEdit() {
    setEditingJid(null);
    setEditTitle(""); setEditNotes(""); setEditTags("");
  }
  async function saveJournalEdit() {
    if (!editingJid) return;
    try {
      await apiClient.patch(`/journal/travel-journal/${editingJid}/`, {
        title: editTitle,
        notes: editNotes,
        tags: toTagArray(editTags),
      });
      cancelJournalEdit();
      await load();
    } catch (e) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    }
  }
  async function deleteJournal(id) {
    if (!confirm("Delete this journal? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/journal/travel-journal/${id}/`);
      await load();
    } catch (e) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    }
  }

  // -----------------
  // Photos state
  // -----------------
  const [photosByJournal, setPhotosByJournal] = useState({});
  const [photoJournalId, setPhotoJournalId] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoErr, setPhotoErr] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function loadPhotos() {
    try {
      const { data } = await apiClient.get("/journal/photos/");
      const rows = Array.isArray(data) ? data : data.results || [];
      const grouped = rows.reduce((acc, p) => {
        const jid = p.journal_entry;
        acc[jid] ||= [];
        acc[jid].push(p);
        return acc;
      }, {});
      setPhotosByJournal(grouped);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        navigate("/signin");
        return;
      }
    }
  }

  async function uploadPhoto(e) {
    e.preventDefault();
    setPhotoErr(null);
    if (!photoJournalId) return setPhotoErr("Please choose a journal.");
    if (!photoFile) return setPhotoErr("Please choose a file.");
    try {
      setUploading(true);
      const form = new FormData();
      form.append("journal_entry", photoJournalId);
      form.append("photo", photoFile);
      await apiClient.post("/journal/photos/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoFile(null);
      await loadPhotos();
    } catch (e) {
      setPhotoErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally {
      setUploading(false);
    }
  }
  async function removePhoto(photoId, journalId) {
    try {
      // Optional confirm
      if (!window.confirm("Remove this photo?")) return;

      await apiClient.delete(`/journal/photos/${photoId}/`);

      // Optimistically update local state
      setPhotosByJournal(prev => {
        const next = { ...prev };
        next[journalId] = (next[journalId] || []).filter(p => p.id !== photoId);
        if (!next[journalId]?.length) delete next[journalId];
        return next;
      });
    } catch (e) {
      setPhotoErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    }
  }


  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewErr, setReviewErr] = useState(null);
  const [savingReview, setSavingReview] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadReviews() {
    try {
      const { data } = await apiClient.get("/journal/my-reviews/");
      setReviews(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        navigate("/signin");
      }
    }
  }
  async function createReview(e) {
    e.preventDefault();
    setReviewErr(null);
    if (rating < 1 || rating > 10) return setReviewErr("Rating must be 1–10.");
    try {
      setSavingReview(true);
      await apiClient.post("/journal/my-reviews/", { rating: Number(rating), comment });
      setRating(5); setComment("");
      await loadReviews();
    } catch (e) {
      setReviewErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally { setSavingReview(false); }
  }
  function startEdit(r) {
    setEditingId(r.id); setEditRating(r.rating); setEditComment(r.comment);
  }
  function cancelEdit() { setEditingId(null); setEditRating(5); setEditComment(""); }
  async function saveEdit() {
    if (editRating < 1 || editRating > 10) return setReviewErr("Rating must be 1–10.");
    try {
      setSavingReview(true);
      await apiClient.patch(`/journal/my-reviews/${editingId}/`, {
        rating: Number(editRating), comment: editComment,
      });
      cancelEdit(); await loadReviews();
    } catch (e) {
      setReviewErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally { setSavingReview(false); }
  }
  async function removeReview(id) {
    if (!confirm("Delete this review?")) return;
    try {
      setDeletingId(id);
      await apiClient.delete(`/journal/my-reviews/${id}/`);
      await loadReviews();
    } catch (e) {
      setReviewErr(e?.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally { setDeletingId(null); }
  }

  // mount loads
  useEffect(() => { loadPhotos(); loadReviews(); }, []);

  const isEmpty = useMemo(() => !loading && journals.length === 0, [loading, journals]);

  return (
    <div className="page journal">
      {/* Page header */}
      <header className="page__head">
        <h1 className="page__title">My Journals</h1>
        <p className="page__subtitle">
          Create entries, upload photos, and manage your reviews in one place.
        </p>
      </header>

      {/* Create Journal */}
      <Section>
        <form onSubmit={createJournal} className="grid grid--2">
          <Field label="Title" hint="e.g., Seoul 2025">
            <TextInput
              placeholder="Trip title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Tags" hint="Comma-separated. e.g., food, museum">
            <TextInput
              placeholder="food, museum"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </Field>
          <div className="grid__span-2">
            <Field label="Notes">
              <Textarea
                rows={6}
                placeholder="Your story, highlights, places…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </Field>
          </div>
          <div className="grid__span-2 row-actions">
            <Button type="submit">Create Journal</Button>
            {error && <p className="error">{error}</p>}
          </div>
        </form>
      </Section>

      {/* Journals list (vertical) */}
      <Section
        title="Your Entries"
        subtitle="All your notes in one tidy grid."
        right={<div className="pill">{loading ? "Loading…" : `${journals.length} total`}</div>}
      >
        {loading ? (
          <div className="cards cards--2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card card--skeleton">
                <div className="sk sk--title" />
                <div className="sk sk--sub" />
                <div className="sk sk--text" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="empty">
            <p className="empty__text">
              No journals yet. Create your first note above ✨
            </p>
          </div>
        ) : (
          <ul className="cards cards--2">
            {journals.map((j) => (
              <li key={j.id} className="card">
                {editingJid === j.id ? (
                  <div className="stack stack--md">
                    <Field label="Title">
                      <TextInput value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </Field>
                    <Field label="Tags" hint="Comma-separated">
                      <TextInput value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                    </Field>
                    <Field label="Notes">
                      <Textarea rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    </Field>
                    <div className="row-actions">
                      <Button onClick={saveJournalEdit}>Save</Button>
                      <Button variant="secondary" onClick={cancelJournalEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card__row">
                      <div>
                        <h3 className="card__title">{j.title}</h3>
                        <p className="card__meta">
                          {j.title} · {new Date(j.created).toLocaleString()}
                        </p>
                      </div>
                      <div className="btn-row">
                        <Button variant="secondary" onClick={() => startJournalEdit(j)}>Edit</Button>
                        <Button variant="danger" onClick={() => deleteJournal(j.id)}>Delete</Button>
                      </div>
                    </div>

                    <p className="card__text">{j.notes}</p>

                    {Array.isArray(j.tags) && j.tags.length > 0 && (
                      <div className="tags">
                        {j.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    )}

                    {(photosByJournal[j.id]?.length ?? 0) > 0 && (
                      <div className="gallery">
                        {photosByJournal[j.id].map((p) => (
                          <div key={p.id} className="gallery__item">
                            <a href={p.url} target="_blank" rel="noreferrer">
                              <img src={p.url} alt={`photo-${p.id}`} className="gallery__img" />
                            </a>
                            <button
                              type="button"
                              className="gallery__remove"
                              onClick={() => removePhoto(p.id, j.id)}   // <-- delete handler
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Upload photo */}
      <Section title="Upload Photos" subtitle="Attach images to one of your journals.">
        <form onSubmit={uploadPhoto} className="grid grid--3">
          <div>
            <Field label="Journal">
              <select
                value={photoJournalId}
                onChange={(e) => setPhotoJournalId(e.target.value)}
                required
                className="select"
              >
                <option value="">Select journal…</option>
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Image file">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                required
                className="file"
              />
            </Field>
          </div>
          <div className="grid__align-end">
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          {photoErr && <div className="error grid__span-3">{photoErr}</div>}
        </form>
      </Section>

      {/* Reviews */}
      <Section title="My Reviews" subtitle="Only you can edit or delete your own reviews.">
        <form onSubmit={createReview} className="grid grid--3 form--gap">
          <div>
            <Field label="Rating" hint="1 – 10">
              <TextInput
                type="number"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                placeholder="8"
                required
              />
            </Field>
          </div>
          <div className="grid__span-2">
            <Field label="Comment">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts…"
                required
              />
            </Field>
          </div>
          <div className="grid__span-3 row-actions">
            <Button type="submit" disabled={savingReview}>
              {savingReview ? "Saving…" : "Add Review"}
            </Button>
            {reviewErr && <p className="error">{reviewErr}</p>}
          </div>
        </form>

        {reviews.length === 0 ? (
          <div className="empty empty--bordered">No reviews yet.</div>
        ) : (
          <ul className="list">
            {reviews.map((r) => (
              <li key={r.id} className="card">
                {editingId === r.id ? (
                  <div className="grid grid--3 form--gap">
                    <div>
                      <Field label="Rating (1–10)">
                        <TextInput
                          type="number"
                          min={1}
                          max={10}
                          value={editRating}
                          onChange={(e) => setEditRating(Number(e.target.value))}
                        />
                      </Field>
                    </div>
                    <div className="grid__span-2">
                      <Field label="Comment">
                        <Textarea
                          rows={3}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="grid__span-3 row-actions">
                      <Button onClick={saveEdit} disabled={savingReview}>Save</Button>
                      <Button variant="secondary" onClick={cancelEdit} disabled={savingReview}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="card__row">
                      <div>
                        <h3 className="card__title">
                          Rating {r.rating}/10 {r.recommended ? "· Recommended" : ""}
                        </h3>
                        <p className="card__meta">
                          {new Date(r.date || r.created).toLocaleString()}
                        </p>
                      </div>
                      <div className="btn-row">
                        <Button variant="secondary" onClick={() => startEdit(r)}>Edit</Button>
                        <Button
                          variant="danger"
                          onClick={() => removeReview(r.id)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                    <p className="card__text">{r.comment}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
