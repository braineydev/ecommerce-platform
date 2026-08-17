import { Suspense } from "react";
import StorefrontClient from "../components/StorefrontClient";
import {
  getCategoriesFromSupabase,
  getProductsFromSupabase,
} from "../lib/catalog";

export const dynamic = "force-static";
export const revalidate = 60;

async function getInitialProducts() {
  try {
    const result = await getProductsFromSupabase({ limit: 24 });
    return result.data;
  } catch {
    return [];
  }
}

async function getInitialCategories() {
  try {
    return await getCategoriesFromSupabase();
  } catch {
    return [];
  }
}

export default async function StorefrontPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getInitialProducts(),
    getInitialCategories(),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcfb]" />}>
      <StorefrontClient
        initialProducts={
          initialProducts as Array<{
            id: string | number;
            slug?: string;
            name: string;
            description?: string;
            price: number | string;
            initial_price?: number | string;
            discounted_price?: number | string;
            stock?: number;
            images?: string[];
            image_name?: string | null;
            category?: { name?: string; slug?: string } | string | null;
            categories?: { name?: string; slug?: string } | string | null;
            category_name?: string;
          }>
        }
        initialCategories={
          initialCategories as Array<{
            id: string | number;
            name: string;
            slug: string;
          }>
        }
      />
    </Suspense>
  );
}
