"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { GiftBoxCartLine } from "@/types/gift-box";

type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  weightGrams: number;
  unitPriceCents: number;
  image: string;
  quantity: number;
};
type CartState = {
  items: CartItem[];
  giftBoxes: GiftBoxCartLine[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  addGiftBox: (line: GiftBoxCartLine) => void;
  removeGiftBox: (configurationId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      giftBoxes: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const current = state.items.find(
            (line) => line.variantId === item.variantId,
          );
          return {
            items: current
              ? state.items.map((line) =>
                  line.variantId === item.variantId
                    ? {
                        ...line,
                        quantity: Math.min(20, line.quantity + quantity),
                      }
                    : line,
                )
              : [...state.items, { ...item, quantity }],
          };
        }),
      update: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((line) => line.variantId !== variantId)
              : state.items.map((line) =>
                  line.variantId === variantId
                    ? { ...line, quantity: Math.min(20, quantity) }
                    : line,
                ),
        })),
      remove: (variantId) =>
        set((state) => ({
          items: state.items.filter((line) => line.variantId !== variantId),
        })),
      addGiftBox: (line) =>
        set((state) => ({
          giftBoxes: [
            ...state.giftBoxes.filter(
              (entry) => entry.configurationId !== line.configurationId,
            ),
            line,
          ],
        })),
      removeGiftBox: (configurationId) =>
        set((state) => ({
          giftBoxes: state.giftBoxes.filter(
            (entry) => entry.configurationId !== configurationId,
          ),
        })),
      clear: () => set({ items: [], giftBoxes: [] }),
    }),
    {
      name: "khan-dry-fruit-cart",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<CartState>;
        return {
          ...state,
          items: state.items ?? [],
          giftBoxes: state.giftBoxes ?? [],
        } as CartState;
      },
    },
  ),
);
