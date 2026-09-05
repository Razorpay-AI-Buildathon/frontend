/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Alert,
  Spinner,
  Divider,
  ProgressBar,
} from "@razorpay/blade/components";
import AppShell from "@/components/AppShell";
import { Target } from "lucide-react";
import { API, authFetch } from "@/lib/api";

interface Strategy {
  strategy: string;
  attempts: number;
  recovered: number;
  recovery_rate: number;
}

const STRATEGY_COLORS: Record<string, "positive" | "negative" | "notice" | "information" | "neutral"> = {
  RETRY_PAYMENT: "information",
  SEND_EMAIL: "notice",
  SEND_SMS: "notice",
  OFFER_EMI: "positive",
  OFFER_DISCOUNT: "positive",
  ESCALATE_HUMAN: "negative",
};

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(API.analyticsStrategies())
      .then((r) => r.ok ? r.json() : Promise.reject("Failed to load"))
      .then((d) => { setStrategies(d.strategies || []); setError(null); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const maxRate = Math.max(...strategies.map((s) => s.recovery_rate), 0.1);

  return (
    <AppShell>
      <Box padding="spacing.8">
        <div className="hide-on-mobile">
          <Box marginBottom="spacing.8">
            <Heading size="xlarge" weight="semibold">Strategy Performance</Heading>
            <Text color="surface.text.gray.muted" marginTop="spacing.1">
              Recovery rates and attempt counts by strategy type
            </Text>
          </Box>
        </div>

        {loading && (
          <Box display="flex" justifyContent="center" padding="spacing.10">
            <Spinner accessibilityLabel="Loading strategies..." size="large" />
          </Box>
        )}

        {error && <Alert color="negative" description={error} isFullWidth />}

        {!loading && strategies.length === 0 && !error && (
          <Box
            backgroundColor="surface.background.gray.subtle"
            borderRadius="medium"
            borderWidth="thin"
            borderColor="surface.border.gray.muted"
            padding="spacing.10"
            textAlign="center"
          >
            <Box display="flex" justifyContent="center" marginBottom="spacing.3">
              <Target size={32} color="#6b7280" />
            </Box>
            <Heading size="medium" marginBottom="spacing.2">No strategy data yet</Heading>
            <Text color="surface.text.gray.muted">
              Simulate failed payments to generate recovery cases and strategy data.
            </Text>
          </Box>
        )}

        {strategies.length > 0 && (
          <Box display="flex" flexDirection="column" gap="spacing.6">
            {/* Recovery Rate chart */}
            <Box
              backgroundColor="surface.background.gray.subtle"
              borderRadius="medium"
              borderWidth="thin"
              borderColor="surface.border.gray.muted"
              padding="spacing.6"
            >
              <Heading size="medium" marginBottom="spacing.6">Recovery Rate by Strategy</Heading>
              <Box display="flex" flexDirection="column" gap="spacing.5">
                {strategies.map((s) => (
                  <Box key={s.strategy}>
                    <Box display="flex" justifyContent="space-between" marginBottom="spacing.2">
                      <Box display="flex" alignItems="center" gap="spacing.3">
                        <Badge size="small" color={STRATEGY_COLORS[s.strategy] || "neutral"}>
                          {s.strategy.replace(/_/g, " ")}
                        </Badge>
                      </Box>
                      <Box display="flex" gap="spacing.4">
                        <Text size="xsmall" color="surface.text.gray.muted">{s.attempts} attempts</Text>
                        <Text size="small" weight="semibold">{s.recovery_rate}%</Text>
                      </Box>
                    </Box>
                    <ProgressBar
                      value={(s.recovery_rate / maxRate) * 100}
                      accessibilityLabel={`${s.strategy}: ${s.recovery_rate}%`}
                      color={s.recovery_rate > 60 ? "positive" : s.recovery_rate > 30 ? "information" : "negative"}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Strategy Table */}
            <Box
              backgroundColor="surface.background.gray.subtle"
              borderRadius="medium"
              borderWidth="thin"
              borderColor="surface.border.gray.muted"
              overflow="hidden"
            >
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#f3f4f6", padding: "8px 20px", borderBottom: "1px solid #e5e7eb" }}>
                {["Strategy", "Attempts", "Recovered", "Recovery Rate"].map((h) => (
                  <Text key={h} size="xsmall" weight="semibold" color="surface.text.gray.muted">{h.toUpperCase()}</Text>
                ))}
              </div>
              {strategies.map((s, i) => (
                <Box key={s.strategy}>
                  {i > 0 && <Divider />}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px", alignItems: "center" }}>
                    <Badge size="small" color={STRATEGY_COLORS[s.strategy] || "neutral"}>
                      {s.strategy.replace(/_/g, " ")}
                    </Badge>
                    <Text size="small">{s.attempts}</Text>
                    <Text size="small">{s.recovered}</Text>
                    <Text size="small" weight="semibold" color={s.recovery_rate > 60 ? "feedback.text.positive.intense" as any : "surface.text.gray.normal"}>
                      {s.recovery_rate}%
                    </Text>
                  </div>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
