import { useEffect, useState } from "react";
import publicApi from "../utils/publicApiClient";

export default function PublicReviewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await publicApi.get("/journal/reviews/"); // PUBLIC endpoint
        setItems(data.results);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading reviews…</div>;

  return (
    <div className="bg-white min-h-screen">   
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Reviews</h1>
        <p className="text-gray-500">Read what travelers say.</p>

        <div className="grid gap-4">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl border p-5 bg-white">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {r.author ?? "Anonymous"}{" "}
                  {r.trip_name ? `· ${r.trip_name}` : ""}
                </div>
                <div className="rounded-full px-3 py-1 border text-sm">
                  Rating {r.rating}/10
                </div>
              </div>
              <p className="mt-3 text-gray-800">{r.comment}</p>
              {r.timestamp && (
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(r.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
