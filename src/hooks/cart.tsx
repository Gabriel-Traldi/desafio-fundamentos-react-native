import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsAddedToCart = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsAddedToCart) {
        setProducts(JSON.parse(productsAddedToCart));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      const productsInCart = [...products];

      const productAlreadyInCart = products.findIndex(
        productInCart => productInCart.id === newProduct.id,
      );

      if (productAlreadyInCart >= 0) {
        productsInCart[productAlreadyInCart].quantity += newProduct.quantity;
      } else {
        productsInCart.push(newProduct);
      }

      setProducts(productsInCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsInCart),
      );
    },
    [products],
  );

  const increment = useCallback(
    async (id: string) => {
      const productUpdated = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      setProducts(productUpdated);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productUpdated),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const updatedProducts = products
        .map(product => {
          if (product.id !== id) {
            return product;
          }

          const updatedProduct = {
            ...product,
            quantity: product.quantity - 1,
          };

          return updatedProduct;
        })
        .filter(product => product.quantity > 0);

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
