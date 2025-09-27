import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";

export default function EditProfile({ onUpdated }) {
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    bio:        "",
    photo:      "",
    birthdate:  "",
  });

  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [userMeta, setUserMeta] = useState({ username: "", email: "" });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await apiClient.get("/authx/profile/");
      const payload = data?.result ?? data;

      setForm({
        first_name: payload?.user?.first_name || "",
        last_name:  payload?.user?.last_name  || "",
        bio:        payload?.bio || "",
        photo:      payload?.photo || "",
        birthdate:  payload?.birthdate || "",
      });
      setUserMeta({
        username: payload?.user?.username || "",
        email:    payload?.user?.email    || "",
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        navigate("/signin");
        return;
      }
      setError(err?.response?.data?.detail || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchProfile();
  }, [fetchProfile, navigate]);

  function toYYYYMMDD(val) {
    if (!val) return val;
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toISOString().slice(0, 10);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("first_name", form.first_name || "");
    fd.append("last_name",  form.last_name  || "");
    fd.append("bio",        form.bio        || "");
    fd.append("birthdate",  toYYYYMMDD(form.birthdate) || "");
    if (photoFile) fd.append("photo", photoFile, photoFile.name);

    try {
      const { data } = await apiClient.patch("/authx/profile/", fd, {});
      setSuccess(data?.message || "Saved!");

      setTimeout(() => {
        navigate("/profile");
      }, 1500);

      const payload = data?.result ?? data;
      if (payload?.photo) setForm((f) => ({ ...f, photo: payload.photo }));

      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview("");
      }
      onUpdated?.();
    } catch (err) {
      const server = err?.response?.data;
      setError(
        (server && (server.detail || JSON.stringify(server))) ||
        err?.message ||
        "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "birthdate" ? toYYYYMMDD(value) : value,
    }));
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      return;
    }
    setPhotoFile(f);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const clearChosenPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <div className="text-sm text-gray-500">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top header */}
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Logged in as <span className="font-medium text-slate-700">{userMeta.username}</span>
          {userMeta.email ? ` • ${userMeta.email}` : ""}
        </p>
      </div>

      {/* Alerts */}
      <div className="mx-auto max-w-5xl px-6 space-y-3">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Content grid */}
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-4">
        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          {/* Left card: Avatar & meta */}
          <aside className="rounded-3xl border border-slate-200 bg-white/70 px-6 py-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-slate-100">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : form.photo ? (
                  <img src={form.photo} alt="Current" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {form.first_name || form.last_name
                    ? `${form.first_name} ${form.last_name}`.trim()
                    : userMeta.username}
                </div>
                <div className="text-sm text-slate-500">{userMeta.email || "—"}</div>
              </div>
            </div>

            {/* File upload */}
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-slate-700">Profile photo</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black/90"
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearChosenPhoto}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                JPG/PNG recommended.
              </p>
            </div>
          </aside>

          {/* Right card: Form fields */}
          <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
              {/* Names */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Lina"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Kim"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={onChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Tell something about you…"
                />
              </div>

              {/* Birthdate */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Birthdate
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={form.birthdate || ""}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow
                             border border-transparent bg-slate-900 text-black hover:bg-black
                             disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow
                             border border-transparent bg-slate-900 text-black hover:bg-black
                             disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
              {success && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-center">
                  {success}
                </div>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
