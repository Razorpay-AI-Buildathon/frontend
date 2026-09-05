/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  TextInput,
  Spinner,
  Alert,
  Divider,
  Dropdown,
  DropdownOverlay,
  ActionList,
  ActionListItem,
  SelectInput,
} from "@razorpay/blade/components";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { API, authFetch, formatINR, STATUS_COLOR, FAILURE_LABELS, timeAgo } from "@/lib/api";
import { useSSE } from "@/lib/sse";

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

const STATUS_OPTIONS = ["", "IDENTIFIED", "ANALYZING", "ACTION_PROPOSED", "GUARD_REVIEW", "APPROVED", "EXECUTING", "RECOVERED", "FAILED", "BLOCKED", "HUMAN_REVIEW", "CLOSED"];
const RISK_OPTIONS = ["", "HIGH", "MEDIUM", "LOW"];

function RecoveryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialStatus = params.get("status") || "";

  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const PAGE_SIZE = 20;

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (statusFilter) queryParams.status = statusFilter;
      const res = await authFetch(API.cases(queryParams));
      if (!res.ok) throw new Error("Failed to load cases");
      const data = await res.json();
      let items: Case[] = data.items || [];
      if (search) {
        const s = search.toLowerCase();
        items = items.filter((c) =>
          c.case_id.toLowerCase().includes(s) ||
          (c.failure_code || "").toLowerCase().includes(s) ||
          (c.proposed_action || "").toLowerCase().includes(s)
        );
      }
      setCases(items);
      setTotal(data.total || 0);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { loadCases(); }, [loadCases]);

  useSSE((ev) => {
    if (["CASE_CREATED", "CASE_UPDATED", "RECOVERED", "FAILED", "HUMAN_REVIEW"].includes(ev.type)) {
      loadCases();
    }
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell>
      <Box padding="spacing.8">
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom="spacing.6">
          <div className="hide-on-mobile">
            <Box>
              <Heading size="xlarge" weight="semibold">Recovery Cases</Heading>
              <Text color="surface.text.gray.muted" marginTop="spacing.1">
                {total.toLocaleString()} total cases
              </Text>
            </Box>
          </div>
        </Box>

        {/* Filters */}
        <Box display="flex" gap="spacing.4" marginBottom="spacing.5" flexWrap="wrap">
          <Box position="relative">
            <Button
              variant="tertiary"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              + Add filter
            </Button>
            {isFilterOpen && (
              <Box
                position="absolute"
                backgroundColor="surface.background.gray.intense"
                borderRadius="medium"
                borderWidth="thin"
                borderColor="surface.border.gray.muted"
                padding="spacing.4"
                marginTop="spacing.2"
                elevation="midRaised"
                zIndex={10}
                minWidth="260px"
              >
                <TextInput
                  label=""
                  placeholder="Filter by..."
                  value={filterSearch}
                  onChange={({ value }) => setFilterSearch(value || "")}
                />
                <Box marginTop="spacing.4" maxHeight="200px" overflow="auto">
                  {STATUS_OPTIONS.filter(s => (s || "All Statuses").toLowerCase().includes(filterSearch.toLowerCase())).map((s) => (
                    <div
                      key={s}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        backgroundColor: statusFilter === s ? "#f0f7ff" : "transparent",
                        borderRadius: "4px"
                      }}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      <Text
                        color={statusFilter === s ? "interactive.text.primary.normal" : "surface.text.gray.normal"}
                        weight={statusFilter === s ? "semibold" : "regular"}
                      >
                        {s || "All Statuses"}
                      </Text>
                    </div>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          <Box flex="1" minWidth="200px">
            <TextInput
              label=""
              placeholder="Search by case ID, failure code..."
              value={search}
              onChange={({ value }) => { setSearch(value || ""); setPage(1); }}
            />
          </Box>
        </Box>

        {error && <Alert color="negative" description={error} marginBottom="spacing.5" isFullWidth />}

        {/* Table */}
        <Box
          backgroundColor="surface.background.gray.subtle"
          borderRadius="medium"
          borderWidth="thin"
          borderColor="surface.border.gray.muted"
          overflow="hidden"
          width="100%"
        >
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "1000px" }}>
              {/* Header */}
              <div className="recovery-table-grid" style={{ background: "#f3f4f6", padding: "8px 20px", borderBottom: "1px solid #e5e7eb" }}>
                {[
                  { label: "Case / Event" },
                  { label: "Amount" },
                  { label: "Failure" },
                  { label: "Strategy", hideOnMobile: true },
                  { label: "Attempt", hideOnMobile: true },
                  { label: "Status" },
                  { label: "Updated" }
                ].map((h) => (
                  <div key={h.label} className={h.hideOnMobile ? "hidden md:block" : ""}>
                    <Text size="xsmall" weight="semibold" color="surface.text.gray.muted">
                      {h.label.toUpperCase()}
                    </Text>
                  </div>
                ))}
              </div>

          {loading ? (
            <Box display="flex" justifyContent="center" padding="spacing.10">
              <Spinner accessibilityLabel="Loading cases..." />
            </Box>
          ) : cases.length === 0 ? (
            <Box padding="spacing.10" textAlign="center">
              <Text color="surface.text.gray.muted" size="medium">
                No cases found. {statusFilter ? `Try clearing the "${statusFilter}" filter.` : "Simulate a failed payment to create cases."}
              </Text>
            </Box>
          ) : (
            cases.map((c, i) => (
              <Box key={c.case_id}>
                {i > 0 && <Divider />}
                <div
                  className="recovery-table-grid"
                  style={{ cursor: "pointer", padding: "14px 20px" }}
                  onClick={() => router.push(`/recovery/${c.case_id}`)}
                >
                  <div>
                    <Text size="small" color="interactive.text.primary.normal" weight="semibold">
                      {c.case_id.slice(0, 18)}…
                    </Text>
                    <Text size="xsmall" color="surface.text.gray.muted">{c.event_type}</Text>
                  </div>
                  <Text size="small" weight="semibold">₹{Number(c.amount).toLocaleString()}</Text>
                  <Text size="small" color="surface.text.gray.muted">
                    {FAILURE_LABELS[c.failure_code || ""] || c.failure_code || "—"}
                  </Text>
                  <div className="hidden md:block">
                    <Text size="small">{c.proposed_action?.replace(/_/g, " ") || "—"}</Text>
                  </div>
                  <div className="hidden md:block">
                    <Text size="small">{c.current_recovery_attempt}</Text>
                  </div>
                  <Badge size="small" color={STATUS_COLOR[c.status] || "neutral"}>
                    {c.status}
                  </Badge>
                  <Text size="xsmall" color="surface.text.gray.muted">{timeAgo(c.created_at)}</Text>
                </div>
              </Box>
            ))
          )}
            </div>
          </div>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" marginTop="spacing.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, display: "flex", alignItems: "center" }}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Previous
            </button>
            <Text size="small" color="surface.text.gray.muted">
              Page {page} of {totalPages}
            </Text>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, display: "flex", alignItems: "center" }}
            >
              Next <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
          </Box>
        )}
      </Box>
    </AppShell>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={null}>
      <RecoveryContent />
    </Suspense>
  );
}
