export type Money = { toNumber(): number };

export type PricedLine = {
  sellerId: string;
  quantity: number;
  price: Money;
  discount: Money | null;
};

export type ProductCardData = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  coverImage: string;
  priceLabel: string;
  onSale: boolean;
  salePercent: number | null;
  compareAtLabel: string | null;
  rating: number;
  reviewsCount: number;
};

export type SortKey = "newest" | "price-asc" | "price-desc" | "rating";

export type SavedAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
};

export type CheckoutItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  name: string;
  label: string;
  image: string;
};

export type AppliedCoupon = {
  code: string;
  percentage: number;
  discount: number;
};

export type Review = {
  id: string;
  title: string;
  review: string;
  rating: number;
  createdAt: string;
  customer: { firstName: string; lastName: string };
};

export type OwnReview = {
  id: string;
  rating: number;
  title: string;
  review: string;
};
