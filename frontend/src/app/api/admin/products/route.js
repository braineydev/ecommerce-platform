import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserRole,
} from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

const PRODUCT_SELECT = "*, categories(id, name, slug)";

async function getCategorySlugById(supabase, categoryId) {
  const { data, error } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  return data?.slug || null;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePriceValues(priceValue, initialValue, discountedValue) {
  const parsedInitialPrice = Number(initialValue ?? priceValue ?? 0);
  const parsedDiscountedPrice = Number(discountedValue ?? priceValue ?? 0);
  return { parsedInitialPrice, parsedDiscountedPrice };
}

function validateProductValues({
  category_id,
  name,
  stock,
  parsedInitialPrice,
  parsedDiscountedPrice,
}) {
  if (
    !category_id ||
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isFinite(parsedInitialPrice) ||
    !Number.isFinite(parsedDiscountedPrice) ||
    parsedInitialPrice < 0 ||
    parsedDiscountedPrice < 0
  ) {
    return "Category, name, and valid non-negative prices are required";
  }
  if (
    stock !== undefined &&
    (!Number.isInteger(Number(stock)) ||
      Number(stock) < 0 ||
      Number(stock) > 1000000)
  ) {
    return "Stock must be a whole number between 0 and 1,000,000";
  }
  if (parsedDiscountedPrice > parsedInitialPrice) {
    return "Discounted price cannot exceed the initial price";
  }
  return null;
}

async function categoryExists(supabase, categoryId) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user || getUserRole(user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    category_id,
    name,
    description,
    price,
    initial_price,
    discounted_price,
    stock,
    images,
    image_name,
    is_featured,
    brand,
    slug,
    meta_title,
    meta_description,
  } = body;

  const { parsedInitialPrice, parsedDiscountedPrice } = normalizePriceValues(
    price,
    initial_price,
    discounted_price,
  );
  const validationError = validateProductValues({
    category_id,
    name,
    stock,
    parsedInitialPrice,
    parsedDiscountedPrice,
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const categoryId = String(category_id).trim();
  try {
    if (!(await categoryExists(supabase, categoryId))) {
      return NextResponse.json(
        {
          error:
            "The selected category no longer exists. Refresh the page and choose a category from the list.",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id: categoryId,
        name,
        brand: typeof brand === "string" ? brand.trim().slice(0, 80) : null,
        slug: slugify(slug || name),
        description,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        price: parsedDiscountedPrice,
        initial_price: parsedInitialPrice,
        discounted_price: parsedDiscountedPrice,
        stock: Number(stock || 0),
        images: Array.isArray(images) ? images : [],
        image_name: typeof image_name === "string" ? image_name.trim() : null,
        is_featured: Boolean(is_featured),
      },
    ])
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }

  try {
    revalidatePath("/");
    const categorySlug = await getCategorySlugById(supabase, categoryId);
    if (categorySlug) {
      revalidatePath(`/categories/${categorySlug}`);
    }
  } catch (error) {
    console.error("Revalidation failed:", error);
  }

  return NextResponse.json({
    message: "Product added successfully",
    product: data,
  });
}
