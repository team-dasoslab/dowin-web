"use client";

import { createContext, useContext } from "react";

const NativeAppContext = createContext(false);

export function NativeAppProvider({
  children,
  isNative,
}: {
  children: React.ReactNode;
  isNative: boolean;
}) {
  return (
    <NativeAppContext.Provider value={isNative}>
      {children}
    </NativeAppContext.Provider>
  );
}

export function useNativeApp() {
  return useContext(NativeAppContext);
}
