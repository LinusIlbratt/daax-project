"use client";

import { useEffect, useState, useCallback } from "react";

const WEB_APP_URL =
  process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000";

export type Product = {
  slug: string;
  name: string;
  pricePerDay: number;
  description: string;
  category: "entreprenad" | "event";
  image: string;
  agreement: string;
  info: string | null;
  requiresDelivery?: boolean;
};

const CATEGORY_LABELS: Record<Product["category"], string> = {
  entreprenad: "Maskiner",
  event: "Bastu & Event",
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9-]/g, "");
}

const emptyProduct = (): Omit<Product, "slug"> => ({
  name: "",
  pricePerDay: 0,
  description: "",
  category: "entreprenad",
  image: "",
  agreement: "standard-uthyrning",
  info: null,
  requiresDelivery: false,
});

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, "slug"> & { slug?: string }>({
    ...emptyProduct(),
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WEB_APP_URL}/api/products`);
      if (!res.ok) throw new Error("Kunde inte hämta produkter");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => {
    setEditingSlug(null);
    setForm({ ...emptyProduct(), slug: "" });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingSlug(p.slug);
    setForm({
      name: p.name,
      pricePerDay: p.pricePerDay,
      description: p.description,
      category: p.category,
      image: p.image,
      agreement: p.agreement,
      info: p.info ?? "",
      requiresDelivery: p.requiresDelivery ?? false,
      slug: p.slug,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlug(null);
  };

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    if ("name" in updates && updates.name != null && !editingSlug) {
      setForm((prev) => ({
        ...prev,
        slug: slugFromName(updates.name),
      }));
    }
  };

  const save = async () => {
    const slug =
      editingSlug ??
      (form.slug?.trim() || slugFromName(form.name) || "objekt");
    const product: Product = {
      slug,
      name: form.name.trim(),
      pricePerDay: Number(form.pricePerDay) || 0,
      description: form.description.trim(),
      category: form.category,
      image: form.image.trim(),
      agreement: form.agreement.trim() || "standard-uthyrning",
      info: form.info?.trim() || null,
      requiresDelivery: !!form.requiresDelivery,
    };

    if (!product.name) {
      alert("Ange ett namn.");
      return;
    }

    setSaving(true);
    try {
      let next = products;
      if (editingSlug) {
        next = products.map((p) => (p.slug === editingSlug ? product : p));
        if (editingSlug !== slug) {
          next = next.filter((p) => p.slug !== editingSlug);
        }
      } else {
        if (products.some((p) => p.slug === slug)) {
          alert("En produkt med denna slug finns redan. Ändra namn eller slug.");
          setSaving(false);
          return;
        }
        next = [...products, product];
      }
      const res = await fetch(`${WEB_APP_URL}/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kunde inte spara");
      }
      setProducts(next);
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("Vill du ta bort denna produkt från listan?")) return;
    setSaving(true);
    try {
      const next = products.filter((p) => p.slug !== slug);
      const res = await fetch(`${WEB_APP_URL}/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: next }),
      });
      if (!res.ok) throw new Error("Kunde inte ta bort");
      setProducts(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kunde inte ta bort");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maskinpark</h1>
          <p className="mt-1 text-slate-600">
            Lägg till och redigera objekt som visas på kundportalen (Maskiner
            respektive Bastu & Event).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Lägg till objekt
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="ml-2 font-medium underline"
          >
            Försök igen
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-600">Laddar produkter…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Bild
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Namn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Pris (kr/dygn)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Avtal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Leverans
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Inga objekt. Klicka på &quot;Lägg till objekt&quot; för att
                      lägga till.
                    </td>
                  </tr>
                ) : (
                  products.map((row) => (
                    <tr
                      key={row.slug}
                      className="bg-white transition hover:bg-slate-50/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.image ? (
                          <img
                            src={
                              row.image.startsWith("/")
                                ? `${WEB_APP_URL}${row.image}`
                                : row.image
                            }
                            alt=""
                            className="h-12 w-16 rounded object-cover"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {CATEGORY_LABELS[row.category]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {row.pricePerDay.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {row.agreement}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {row.requiresDelivery ? "Ja" : "Nej"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-slate-600 hover:text-slate-900 underline"
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row.slug)}
                          className="ml-3 text-red-600 hover:text-red-800 underline"
                        >
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          form={form}
          updateForm={updateForm}
          isEdit={!!editingSlug}
          saving={saving}
          onSave={save}
          onClose={closeModal}
          webAppUrl={WEB_APP_URL}
        />
      )}
    </div>
  );
}

function ProductModal({
  form,
  updateForm,
  isEdit,
  saving,
  onSave,
  onClose,
  webAppUrl,
}: {
  form: Omit<Product, "slug"> & { slug?: string };
  updateForm: (u: Partial<typeof form>) => void;
  isEdit: boolean;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  webAppUrl: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <h2
            id="product-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {isEdit ? "Redigera objekt" : "Lägg till objekt"}
          </h2>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Namn (titel) *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="t.ex. Mobil Bastuvagn Lyx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Slug (URL-vänligt id)
            </label>
            <input
              type="text"
              value={form.slug ?? ""}
              onChange={(e) => updateForm({ slug: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="t.ex. mobil-bastuvagn-lyx"
            />
            <p className="mt-1 text-xs text-slate-500">
              Används i adressen. Fylls i automatiskt från namnet om du lämnar
              tomt.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Beskrivning
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Kort beskrivning som visas på kundportalen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Pris (kr/dygn) *
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.pricePerDay || ""}
              onChange={(e) =>
                updateForm({
                  pricePerDay: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Var visas objektet?
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                updateForm({
                  category: e.target.value as "entreprenad" | "event",
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="entreprenad">Maskiner (entreprenad)</option>
              <option value="event">Bastu & Event</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Bild (sökväg eller URL)
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => updateForm({ image: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="t.ex. /images/bastuvagn.jpg"
            />
            {form.image && (
              <div className="mt-2">
                <img
                  src={
                    form.image.startsWith("/")
                      ? `${webAppUrl}${form.image}`
                      : form.image
                  }
                  alt="Förhandsvisning"
                  className="h-24 w-32 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Avtal
            </label>
            <input
              type="text"
              value={form.agreement}
              onChange={(e) => updateForm({ agreement: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="t.ex. standard-uthyrning, bastu-uthyrning"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Övrig info (valfritt)
            </label>
            <input
              type="text"
              value={form.info ?? ""}
              onChange={(e) => updateForm({ info: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="t.ex. Plats för 6 pers"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.requiresDelivery}
              onChange={(e) =>
                updateForm({ requiresDelivery: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">
              Kräver leverans/hämtning
            </span>
          </label>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Sparar…" : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
