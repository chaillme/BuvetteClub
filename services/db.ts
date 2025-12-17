import { User, Drink, Consumption, Transaction, TransactionType, PaymentMethod, TransactionItem } from '../types';

const STORAGE_KEYS = {
  USERS: 'bc_users',
  DRINKS: 'bc_drinks',
  CONSUMPTIONS: 'bc_consumptions',
  TRANSACTIONS: 'bc_transactions',
};

// Helpers
const load = <T,>(key: string, def: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : def;
};

const save = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Users ---
export const getUsers = (): User[] => load(STORAGE_KEYS.USERS, []);

export const addUser = (name: string): User => {
  const users = getUsers();
  const newUser: User = { id: generateId(), name, createdAt: Date.now() };
  save(STORAGE_KEYS.USERS, [...users, newUser]);
  return newUser;
};

export const updateUser = (id: string, name: string) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index].name = name;
    save(STORAGE_KEYS.USERS, users);
  }
};

export const deleteUser = (id: string) => {
  const users = getUsers();
  save(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
  // Consumptions are logically orphaned or deleted. Let's clean them up.
  const consumptions = getConsumptions();
  save(STORAGE_KEYS.CONSUMPTIONS, consumptions.filter(c => c.userId !== id));
};

// --- Drinks ---
export const getDrinks = (): Drink[] => load(STORAGE_KEYS.DRINKS, []);

export const saveDrink = (drink: Omit<Drink, 'id'> & { id?: string }) => {
  const drinks = getDrinks();
  if (drink.id) {
    const index = drinks.findIndex(d => d.id === drink.id);
    if (index !== -1) {
      drinks[index] = drink as Drink;
    }
  } else {
    drinks.push({ ...drink, id: generateId() } as Drink);
  }
  save(STORAGE_KEYS.DRINKS, drinks);
};

export const deleteDrink = (id: string) => {
  const drinks = getDrinks();
  save(STORAGE_KEYS.DRINKS, drinks.filter(d => d.id !== id));
};

// --- Consumptions (The "Ardoise") ---
export const getConsumptions = (): Consumption[] => load(STORAGE_KEYS.CONSUMPTIONS, []);

export const getConsumptionsForUser = (userId: string): Consumption[] => {
  return getConsumptions().filter(c => c.userId === userId);
};

export const addConsumption = (userId: string, drink: Drink) => {
  const all = getConsumptions();
  // Check if same item exists with same price
  const existing = all.find(c => 
    c.userId === userId && 
    c.drinkId === drink.id && 
    c.priceSaleAtTime === drink.price_sale
  );

  if (existing) {
    existing.quantity += 1;
    save(STORAGE_KEYS.CONSUMPTIONS, all);
  } else {
    const newC: Consumption = {
      id: generateId(),
      userId,
      drinkId: drink.id,
      drinkName: drink.name,
      quantity: 1,
      priceSaleAtTime: drink.price_sale,
      pricePurchaseAtTime: drink.price_purchase
    };
    save(STORAGE_KEYS.CONSUMPTIONS, [...all, newC]);
  }
};

export const removeOneConsumption = (consumptionId: string) => {
  const all = getConsumptions();
  const index = all.findIndex(c => c.id === consumptionId);
  if (index !== -1) {
    if (all[index].quantity > 1) {
      all[index].quantity -= 1;
      save(STORAGE_KEYS.CONSUMPTIONS, all);
    } else {
      save(STORAGE_KEYS.CONSUMPTIONS, all.filter(c => c.id !== consumptionId));
    }
  }
};

// --- Transactions ---
export const getTransactions = (): Transaction[] => load(STORAGE_KEYS.TRANSACTIONS, []);

export const createTransaction = (
  user: User, 
  consumptions: Consumption[], 
  type: TransactionType, 
  paymentMethod: PaymentMethod
) => {
  const items: TransactionItem[] = consumptions.map(c => ({
    name: c.drinkName,
    quantity: c.quantity,
    unitPriceSale: c.priceSaleAtTime,
    unitPricePurchase: c.pricePurchaseAtTime
  }));

  const totalPriceSale = items.reduce((sum, item) => sum + (item.unitPriceSale * item.quantity), 0);
  const totalPricePurchase = items.reduce((sum, item) => sum + (item.unitPricePurchase * item.quantity), 0);

  const transaction: Transaction = {
    id: generateId(),
    userId: user.id,
    userName: user.name,
    timestamp: Date.now(),
    items,
    totalPriceSaleAtTime: totalPriceSale,
    totalPricePurchaseAtTime: totalPricePurchase,
    type,
    paymentMethod
  };

  const transactions = getTransactions();
  save(STORAGE_KEYS.TRANSACTIONS, [transaction, ...transactions]); // Prepend for recency
  
  // Clean up user and consumptions after transaction
  deleteUser(user.id);
};