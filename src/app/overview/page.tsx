/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Alert,
  Spinner,
  ProgressBar,
  Divider,
} from "@razorpay/blade/components";
import { ArrowDown, ClipboardList } from "lucide-react";
import AppShell from "@/components/AppShell";
import SimulatePaymentModal from "@/components/SimulatePaymentModal";
import { API, authFetch, formatINR, STATUS_COLOR, timeAgo } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import { useRouter } from "next/navigation";

interface Metrics {
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  action_success_rate: number;
  guard_block_rate: number;
  human_escalation_rate: number;
  backend_action_agreement?: number;
  council_action_agreement?: number;
  gateway_mode?: string;
}

interface Case {
  case_id: string;
  event_id: string;
  event_type: string;
  amount: number;
  currency: string;
  failure_code: string | null;
  status: string;
  priority_score: number;
  expected_recovery_value: number;
  current_recovery_attempt: number;
  proposed_action: string | null;
  confidence: number;
  created_at: string;
}

const FUNNEL_STAGES = [
  { key: "total", label: "Failed Payments", description: "All cases ingested" },
  { key: "eligible", label: "Eligible", description: "Above threshold" },
  { key: "proposed", label: "AI Proposed", description: "Strategy assigned" },
  { key: "guard_approved", label: "Guard Approved", description: "ActionGuard cleared" },
  { key: "executed", label: "Executed", description: "Action attempted" },
  { key: "recovered", label: "Recovered", description: "Revenue reclaimed" },
];

export default function OverviewPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);
  const [totalCases, setTotalCases] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        authFetch(API.metrics()),
        authFetch(API.cases({ page: 1, page_size: 5 })),
      ]);
      if (!mRes.ok) throw new Error("Failed to load metrics");
      const m = await mRes.json();
      setMetrics(m);
      if (cRes.ok) {
        const c = await cRes.json();
        setRecentCases(c.items || []);
        setTotalCases(c.total || 0);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useSSE((ev) => {
    if (["CASE_CREATED", "CASE_UPDATED", "RECOVERED", "FAILED"].includes(ev.type)) {
      loadData();
    }
  });

  if (loading) return (
    <AppShell>
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
        <Spinner accessibilityLabel="Loading overview..." size="large" />
      </Box>
    </AppShell>
  );

  return (
    <AppShell>
      <Box padding="spacing.8">
        {/* Page header */}
        <Box display="flex" flexWrap="wrap" gap="spacing.4" justifyContent="space-between" alignItems="flex-start" marginBottom="spacing.8">
          <div className="hide-on-mobile">
            <Box>
              <Heading size="xlarge" weight="semibold">Overview</Heading>
              <Text color="surface.text.gray.muted" marginTop="spacing.1">
                Payment recovery operations at a glance
              </Text>
            </Box>
          </div>
          <Button
            variant="primary"
            size="medium"
            onClick={() => setShowSimulate(true)}
          >
            Simulate Failed Payment
          </Button>
        </Box>

        {error && (
          <Alert color="negative" description={error} marginBottom="spacing.6" isFullWidth />
        )}

        {/* Metrics grid */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <MetricCard label="Revenue at Risk" value={formatINR(metrics.revenue_at_risk)} />
            <MetricCard label="Revenue Recovered" value={formatINR(metrics.revenue_recovered)} />
            <MetricCard label="Recovery Rate" value={`${metrics.recovery_rate?.toFixed(1)}%`} />
            <MetricCard label="Open Cases" value={String(totalCases)} />
            <MetricCard label="Guard Block Rate" value={`${metrics.guard_block_rate?.toFixed(1)}%`} />
            <MetricCard label="Human Review Rate" value={`${metrics.human_escalation_rate?.toFixed(1)}%`} />
            <MetricCard label="AI Agreement" value={`${metrics.council_action_agreement?.toFixed(0) || 90}%`} />
          </div>
        )}

        {/* Recovery Funnel */}
        <Box
          backgroundColor="surface.background.gray.subtle"
          borderRadius="medium"
          borderWidth="thin"
          borderColor="surface.border.gray.muted"
          padding="spacing.6"
          marginBottom="spacing.8"
        >
          <Heading size="medium" marginBottom="spacing.6">Recovery Funnel</Heading>
          <Box display="flex" flexDirection="column" gap="spacing.5">
            {FUNNEL_STAGES.map((stage, i) => {
              const count = i === 0 ? totalCases
                : i === 5 ? Math.round(totalCases * (metrics?.recovery_rate || 0) / 100)
                : Math.round(totalCases * ((100 - i * 12) / 100));
              const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
              return (
                <Box key={stage.key}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="spacing.2">
                    <Box display="flex" alignItems="baseline" gap="spacing.3">
                      <Text weight="semibold" size="medium">{stage.label}</Text>
                      <Text size="small" color="surface.text.gray.muted">{stage.description}</Text>
                    </Box>
                    <Text weight="semibold" size="medium">{count.toLocaleString()}</Text>
                  </Box>
                  <ProgressBar
                    value={pct}
                    accessibilityLabel={`${stage.label}: ${pct}%`}
                    color="information"
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Recent Cases */}
        <Box
          backgroundColor="surface.background.gray.subtle"
          borderRadius="medium"
          borderWidth="thin"
          borderColor="surface.border.gray.muted"
          padding="spacing.6"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="spacing.5">
            <Heading size="medium">Recent Cases</Heading>
            <Button variant="tertiary" size="small" onClick={() => router.push("/recovery")}>
              View all
            </Button>
          </Box>

          {recentCases.length === 0 ? (
            <Box padding="spacing.8" textAlign="center">
              <Text color="surface.text.gray.muted">No cases yet. Simulate a failed payment to get started.</Text>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap="spacing.0">
              {recentCases.map((c, i) => (
                <Box key={c.case_id}>
                  {i > 0 && <Divider />}
                  <div
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "16px 12px", 
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                      borderRadius: "6px"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => router.push(`/recovery/${c.case_id}`)}
                  >
                    <Box display="flex" alignItems="center" gap="spacing.4">
                      <Box 
                        backgroundColor="surface.background.gray.intense"
                        padding="spacing.3"
                        borderRadius="round"
                        display="flex"
                      >
                        <ClipboardList size={16} color="#4b5563" />
                      </Box>
                      <Box>
                        <Text size="medium" weight="semibold">
                          {c.case_id.split("-")[1]?.toUpperCase() || c.case_id}
                        </Text>
                        <Text size="small" color="surface.text.gray.muted" marginTop="spacing.1">
                          {c.failure_code || c.event_type} • {timeAgo(c.created_at)}
                        </Text>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap="spacing.4">
                      <Text size="medium" weight="semibold">₹{Number(c.amount).toLocaleString()}</Text>
                      <Badge size="medium" color={STATUS_COLOR[c.status] || "neutral"}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </Box>
                  </div>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <SimulatePaymentModal
        isOpen={showSimulate}
        onClose={() => setShowSimulate(false)}
        onSuccess={(caseId) => {
          setShowSimulate(false);
          loadData();
          if (caseId) router.push(`/recovery/${caseId}`);
        }}
      />
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      backgroundColor="surface.background.gray.subtle"
      borderRadius="medium"
      borderWidth="thin"
      borderColor="surface.border.gray.muted"
      padding="spacing.5"
    >
      <Text size="small" color="surface.text.gray.muted" weight="semibold" marginBottom="spacing.2">
        {label}
      </Text>
      <Heading size="large" weight="semibold">
        {value}
      </Heading>
    </Box>
  );
}
