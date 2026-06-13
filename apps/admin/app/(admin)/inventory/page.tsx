"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  PRODUCTS_INVENTORY_LIST_COLUMNS,
  PRODUCTS_LIST_COLUMNS,
  type ProductCategory,
  type ProductInsert,
  type ProductInventoryListRow,
  type ProductRow,
  type ProductUpdatePayload,
  parseProductInventoryListRow,
  parseProductRow,
} from "@/lib/supabase/product-types";
import { uploadProductImage } from "@/lib/supabase/product-storage";
import { ProductForm, type ProductFormSubmitPayload } from "./ProductForm";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  entreprenad: "Maskin",
  event: "Bastu & Event",
};

function slugFromTitle(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
  s = s.replace(/\./g, "-");
  s = s.replace(/\s+/g, "-");
  s = s.replace(/[^a-z0-9-]+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s;
}

async function ensureUniqueSlug(client: SupabaseClient, title: string): Promise<string> {
  const base = slugFromTitle(title) || "hyrobjekt";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const { data, error } = await client
      .from("products")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) {
      console.error("inventory: ensureUniqueSlug", error.message, error);
      throw new Error(error.message || "Kunde inte kontrollera om slug redan finns.");
    }
    if (data === null) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function mapPostgrestError(message: string, code?: string): string {
  if (code === "23503" || message.includes("violates foreign key")) {
    return "Objektet kan inte raderas eftersom det är kopplat till bokningar eller annan data.";
  }
  if (code === "23505" || message.includes("duplicate key")) {
    return "En post med samma slug finns redan. Ändra titeln och försök igen.";
  }
  if (message.includes("Bucket not found") || message.includes("bucket")) {
    return "Lagringsbucket saknas. Kör migrationen för product-images i Supabase eller skapa bucket manuellt.";
  }
  if (message.includes("permission denied") || message.includes("new row violates row-level security")) {
    return "Du saknar behörighet. Kontrollera att du är inloggad och att RLS-policyer är korrekt satta i Supabase.";
  }
  return message || "Ett oväntat fel inträffade.";
}

type ModalMode = "create" | "edit" | null;

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductInventoryListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (!isSupabaseConfigured()) {
      setLoadError("Supabase är inte konfigurerat (saknar URL eller anon-nyckel).");
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCTS_INVENTORY_LIST_COLUMNS)
        .order("slug", { ascending: true });
      if (error) {
        console.error("inventory: fetch products", error.message, error);
        setLoadError(error.message || "Kunde inte hämta hyrobjekt.");
        setProducts([]);
        return;
      }
      const rows: ProductInventoryListRow[] = [];
      for (const item of data ?? []) {
        const parsed = parseProductInventoryListRow(item);
        if (parsed) rows.push(parsed);
        else console.error("inventory: unexpected row shape", item);
      }
      setProducts(rows);
    } catch (e) {
      console.error("inventory: fetch products", e);
      setLoadError(e instanceof Error ? e.message : "Kunde inte hämta hyrobjekt.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const closeModal = () => {
    setModalMode(null);
    setEditSlug(null);
    setEditProduct(null);
    setLoadingEdit(false);
    setMutationError(null);
  };

  const openCreate = () => {
    setMutationError(null);
    setModalMode("create");
    setEditSlug(null);
    setEditProduct(null);
    setLoadingEdit(false);
  };

  const openEdit = async (slug: string) => {
    setMutationError(null);
    if (!isSupabaseConfigured()) {
      setMutationError("Supabase är inte konfigurerat.");
      return;
    }
    setModalMode("edit");
    setEditSlug(slug);
    setEditProduct(null);
    setLoadingEdit(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("products").select(PRODUCTS_LIST_COLUMNS).eq("slug", slug).single();
      if (error) {
        console.error("inventory: load product", error.message, error);
        setMutationError(error.message || "Kunde inte läsa objektet.");
        setLoadingEdit(false);
        setModalMode(null);
        setEditSlug(null);
        return;
      }
      const row = parseProductRow(data);
      if (!row) {
        setMutationError("Ogiltig data från databasen.");
        setLoadingEdit(false);
        setModalMode(null);
        setEditSlug(null);
        return;
      }
      setEditProduct(row);
    } catch (e) {
      console.error("inventory: load product", e);
      setMutationError(e instanceof Error ? e.message : "Kunde inte läsa objektet.");
      setModalMode(null);
      setEditSlug(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleFormSubmit = async (payload: ProductFormSubmitPayload, newImageFile: File | null) => {
    setMutationError(null);
    if (!isSupabaseConfigured()) {
      setMutationError("Supabase är inte konfigurerat.");
      return;
    }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("inventory: getUser", userError.message, userError);
        setMutationError(userError.message || "Kunde inte läsa inloggad användare.");
        return;
      }
      if (!user?.id) {
        setMutationError("Du måste vara inloggad.");
        return;
      }

      let imageUrl = payload.existingImageUrl;
      if (newImageFile) {
        const pathSlug =
          payload.mode === "edit" && payload.editSlug
            ? payload.editSlug
            : slugFromTitle(payload.title) || "ny";
        try {
          imageUrl = await uploadProductImage(supabase, user.id, pathSlug, newImageFile);
        } catch (e) {
          console.error("inventory: image upload", e);
          setMutationError(e instanceof Error ? e.message : "Bilduppladdningen misslyckades.");
          return;
        }
      }

      if (payload.mode === "create") {
        const slug = await ensureUniqueSlug(supabase, payload.title);
        const insertRow: ProductInsert = {
          slug,
          name: payload.title,
          price_per_day: payload.priceDay,
          price_per_week: payload.priceWeek,
          price_per_month: payload.priceMonth,
          description: payload.description,
          category: payload.category,
          image: imageUrl,
          agreement: payload.agreement,
          info: payload.info,
          requires_delivery: payload.requiresDelivery,
          is_active: payload.isActive,
          created_by: user.id,
        };
        const { error } = await supabase.from("products").insert(insertRow);
        if (error) {
          console.error("inventory: insert", error.message, error);
          setMutationError(mapPostgrestError(error.message, error.code));
          return;
        }
      } else {
        if (!payload.editSlug) {
          setMutationError("Saknar slug för uppdatering.");
          return;
        }
        const updateRow: ProductUpdatePayload = {
          name: payload.title,
          price_per_day: payload.priceDay,
          price_per_week: payload.priceWeek,
          price_per_month: payload.priceMonth,
          description: payload.description,
          category: payload.category,
          image: imageUrl,
          agreement: payload.agreement,
          info: payload.info,
          requires_delivery: payload.requiresDelivery,
          is_active: payload.isActive,
        };
        const { error } = await supabase.from("products").update(updateRow).eq("slug", payload.editSlug);
        if (error) {
          console.error("inventory: update", error.message, error);
          setMutationError(mapPostgrestError(error.message, error.code));
          return;
        }
      }

      closeModal();
      await fetchProducts();
    } catch (e) {
      console.error("inventory: save", e);
      setMutationError(e instanceof Error ? e.message : "Kunde inte spara.");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (slug: string) => {
    if (!confirm("Vill du radera detta hyrobjekt permanent?")) return;
    setMutationError(null);
    if (!isSupabaseConfigured()) {
      setMutationError("Supabase är inte konfigurerat.");
      return;
    }
    setDeletingSlug(slug);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("products").delete().eq("slug", slug);
      if (error) {
        console.error("inventory: delete product", error.message, error);
        setMutationError(mapPostgrestError(error.message, error.code));
        return;
      }
      setProducts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (e) {
      console.error("inventory: delete product", e);
      setMutationError(e instanceof Error ? e.message : "Kunde inte radera hyrobjektet.");
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--admin-text))] sm:text-3xl">
            Hyrobjekt
          </h1>
          <p className="mt-1.5 text-[rgb(var(--admin-text-muted))]">
            Här lägger du till och ändrar maskiner som kunder ser på webben.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            Lägg till hyrobjekt
          </button>
        </div>
      </div>

      {loadError && (
        <div className="admin-card flex flex-col gap-3 border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-5 py-4 text-sm text-[rgb(var(--admin-error))] sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void fetchProducts()}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            Försök igen
          </button>
        </div>
      )}

      {mutationError && !modalMode && (
        <div
          role="alert"
          className="admin-card border-[rgb(var(--admin-error))]/30 bg-[rgb(var(--admin-error-muted))] px-5 py-4 text-sm text-[rgb(var(--admin-error))]"
        >
          {mutationError}
        </div>
      )}

      {loading ? (
        <div className="admin-card flex items-center gap-3 p-8">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-[rgb(var(--admin-primary))] border-t-transparent"
            aria-hidden
          />
          <p className="text-[rgb(var(--admin-text-muted))]">Laddar hyrobjekt…</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-[rgb(var(--admin-border))] bg-slate-50/80">
                  <th className="admin-table-th w-14">Bild</th>
                  <th className="admin-table-th">Titel</th>
                  <th className="admin-table-th">Kategori</th>
                  <th className="admin-table-th">Dagspris</th>
                  <th className="admin-table-th">Veckopris</th>
                  <th className="admin-table-th">Månadspris</th>
                  <th className="admin-table-th">Utkörning</th>
                  <th className="admin-table-th">Synlig på webben</th>
                  <th className="admin-table-th text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--admin-border-muted))]">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="admin-table-td py-12 text-center text-[rgb(var(--admin-text-muted))]"
                    >
                      Inga hyrobjekt ännu. Klicka på &quot;Lägg till hyrobjekt&quot;.
                    </td>
                  </tr>
                ) : (
                  products.map((row) => (
                    <tr key={row.slug} className="bg-white transition hover:bg-slate-50/50">
                      <td className="admin-table-td">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[rgb(var(--admin-border))] bg-slate-100">
                          {row.image.startsWith("http") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-[rgb(var(--admin-text-subtle))]">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="admin-table-td font-medium text-[rgb(var(--admin-text))]">
                        <div className="max-w-[12rem] truncate" title={row.name}>
                          {row.name}
                        </div>
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {CATEGORY_LABELS[row.category]}
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {row.price_per_day.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {row.price_per_week.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {row.price_per_month.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {row.requires_delivery ? "Ja" : "Nej"}
                      </td>
                      <td className="admin-table-td text-[rgb(var(--admin-text-muted))]">
                        {row.is_active ? "Ja" : "Nej"}
                      </td>
                      <td className="admin-table-td text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void openEdit(row.slug)}
                          className="rounded-xl px-3 py-1.5 text-sm font-medium text-[rgb(var(--admin-primary))] hover:bg-[rgb(var(--admin-primary-muted))]"
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeProduct(row.slug)}
                          disabled={deletingSlug === row.slug}
                          className="ml-2 rounded-xl px-3 py-1.5 text-sm font-medium text-[rgb(var(--admin-error))] hover:bg-[rgb(var(--admin-error-muted))] disabled:opacity-50"
                        >
                          {deletingSlug === row.slug ? "Raderar…" : "Radera"}
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

      {modalMode && (
        <ProductForm
          mode={modalMode}
          editSlug={editSlug}
          initialLoading={modalMode === "edit" && loadingEdit}
          initialProduct={editProduct}
          saving={saving}
          externalError={mutationError}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
