export type Money = { toNumber(): number };

export type OrderStatus = "ORDERED" | "SHIPPED" | "OUTFORDELIVERY" | "DELIVERED" | "CANCELLED";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type OrderSummary = {
  createdAt: string;
  status: OrderStatus;
  paymentMethod: string;
  customerId: string;
  orderRevenue: number;
  items: { productName: string; revenue: number }[];
};

export type ChartPoint = { date: string; value: number };

export type ChartSlice = { key: string; count: number; fill: string };

export type SellerOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer: { firstName: string; lastName: string; email: string };
  itemCount: number;
  sellerTotal: number;
};

export type SellerOrderItem = {
  id: string;
  orderId: string;
  status: OrderStatus;
  quantity: number;
  price: number;
  discount: number | null;
  variantLabel: string;
  productName: string;
  subtotal: number;
};

export type CouponDraft = {
  id: string;
  code: string;
  percentage: number;
  minAmount: number | null;
  maxUses: number | null;
  expiresAt: string | null;
};

export type SellerCoupon = CouponDraft & {
  usedCount: number;
  isActive: boolean;
};

export type Category = { id: string; name: string };

export type OptionDraft = {
  id: string;
  name: string;
  hasColor: boolean;
  values: { id: string; value: string; hex: string }[];
};

export type VariantDraft = {
  price: string;
  discount: string;
  quantity: string;
  sku: string;
  coverImage: string;
  images: string[];
};

export type SellerProduct = {
  id: string;
  name: string;
  brand: string;
  coverImage: string;
  category: string | null;
  variants: { price: number; discount: number | null; quantity: number }[];
  options: { name: string; valueCount: number }[];
  featured: boolean;
};

export type EditableProduct = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description: string;
  coverImage: string;
  images: string[];
  categoryId: string;
  defaultVariantId: string;
  options: { id: string; name: string; values: { id: string; value: string; hex: string | null }[] }[];
  variants: {
    id: string;
    label: string;
    price: number;
    discount: number | null;
    quantity: number;
    sku: string | null;
    coverImage: string | null;
    images: string[];
    archived: boolean;
  }[];
};

export type SellerReturn = {
  id: string;
  orderId: string;
  orderNumber: number;
  reason: string;
  status: ReturnStatus;
  refundAmount: number | null;
  createdAt: string;
  customerName: string;
  items: { id: string; productName: string; variantLabel: string; quantity: number }[];
  eligibleTotal: number;
};
