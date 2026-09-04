"use client";

import React from "react";
import { BladeProvider } from "@razorpay/blade/components";
import { bladeTheme } from "@razorpay/blade/tokens";
import StyledComponentsRegistry from "@/lib/blade-registry";

export default function BladeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <BladeProvider themeTokens={bladeTheme} colorScheme="light">
        {children}
      </BladeProvider>
    </StyledComponentsRegistry>
  );
}
