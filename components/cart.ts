export const CART_STORAGE_KEY = "massimo-cart";
export const CART_CHANGED_EVENT = "massimo-cart-changed";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  img?: string;
  quantity: number;
  option?: string;
};

type CartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

export const getCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(cart)) return [];

    return cart.filter(
      (item): item is CartItem =>
        typeof item?.id === "string" &&
        typeof item.title === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number",
    );
  } catch {
    return [];
  }
};

const saveCart = (cart: CartItem[]) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

export const addToCart = (item: CartItemInput) => {
  const cart = getCart();
  const existingItem = cart.find(
    (cartItem) => cartItem.id === item.id && cartItem.option === item.option,
  );

  if (existingItem) {
    existingItem.quantity += item.quantity ?? 1;
  } else {
    cart.push({ ...item, quantity: item.quantity ?? 1 });
  }

  saveCart(cart);
};

export const updateCartQuantity = (
  id: string,
  option: string | undefined,
  quantity: number,
) => {
  const cart = getCart()
    .map((item) =>
      item.id === id && item.option === option ? { ...item, quantity } : item,
    )
    .filter((item) => item.quantity > 0);

  saveCart(cart);
};

export const removeFromCart = (id: string, option: string | undefined) => {
  saveCart(
    getCart().filter((item) => item.id !== id || item.option !== option),
  );
};
