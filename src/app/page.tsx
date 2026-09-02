"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/overview");
  }, [router]);
  return null;
}
