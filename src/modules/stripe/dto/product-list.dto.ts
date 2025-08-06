export interface Price {
  unit_amount_decimal: any;
  id: string;
  object: string;
  unit_amount: number | null;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
  product: string;
}

export interface Product {
  id: string;
  object: string;
  active: boolean;
  attributes: string[];
  created: number;
  default_price: string | null;
  description: string | null;
  features: string[];
  images: string[];
  livemode: boolean;
  metadata: Record<string, any>;
  name: string;
  package_dimensions: any | null;
  shippable: boolean | null;
  statement_descriptor: string | null;
  tax_code: string | null;
  type: string;
  unit_label: string | null;
  updated: number;
  url: string | null;
  prices: Price[];
}

export interface ProductList {
  object: string;
  data: Product[];
  has_more: boolean;
  url: string;
}