export type Address = { postalCode: string; street: string; city: string };
export type Customer = { id: string; address: Address | null };
export type Product = {
  id: string;
  priceCents: number;
  currency: string;
  available: boolean;
};
