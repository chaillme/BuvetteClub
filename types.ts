export type User = {
  id: string;
  name: string;
  createdAt: number;
};

export enum DrinkCategory {
  ALCOHOL = 'Alcohol',
  SOFT = 'Soft',
  FOOD = 'Nourriture',
}

export type Drink = {
  id: string;
  name: string;
  price_purchase: number;
  price_sale: number;
  category: DrinkCategory;
};

export type Consumption = {
  id: string;
  userId: string;
  drinkId: string;
  drinkName: string; // Cached for display if drink is deleted
  quantity: number;
  priceSaleAtTime: number; // Snapshot
  pricePurchaseAtTime: number; // Snapshot
};

export enum TransactionType {
  SALE = 'SALE',
  DELETION = 'DELETION',
}

export enum PaymentMethod {
  CASH = 'Espèces',
  CARD = 'Carte',
  NONE = 'Aucun', // For deletions
}

export type TransactionItem = {
  name: string;
  quantity: number;
  unitPriceSale: number;
  unitPricePurchase: number;
};

export type Transaction = {
  id: string;
  userId: string; // Kept for reference even if user is deleted
  userName: string;
  timestamp: number;
  items: TransactionItem[];
  totalPriceSaleAtTime: number;
  totalPricePurchaseAtTime: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
};

export type ViewState = 'CLIENTS' | 'MENU' | 'HISTORY';