"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, User } from "@/lib/auth";
import { Box, Spinner, Text } from "@razorpay/blade/components";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "unauth">("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) {
        setStatus("unauth");
        router.replace("/login");
      } else {
        setUser(u);
        setStatus("ok");
      }
    });
  }, [router]);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        backgroundColor="surface.background.gray.intense"
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.4">
          <Spinner accessibilityLabel="Checking session..." size="large" />
          <Text color="surface.text.gray.muted" size="medium">
            Checking session...
          </Text>
        </Box>
      </Box>
    );
  }

  if (status === "unauth") return null;

  return <>{children}</>;
}
