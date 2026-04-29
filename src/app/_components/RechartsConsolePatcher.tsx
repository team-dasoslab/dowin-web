"use client";

import { useEffect } from "react";

export function RechartsConsolePatcher() {
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = args[0];
      if (
        typeof msg === "string" &&
        msg.includes("The width(-1) and height(-1) of chart should be greater than 0")
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
