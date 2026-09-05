/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Badge,
  Alert,
  Spinner,
  Divider,
  Button,
  TextInput,
} from "@razorpay/blade/components";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { API, authFetch, timeAgo } from "@/lib/api";

interface AuditEvent {
  id: string;
  case_id: string | null;
  action_id: string | null;
  event_type: string;
  actor: string;
  decision_source: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

const EVENT_TYPES = [
  "", "CASE_CREATED", "COUNCIL_STARTED", "ACTION_PROPOSED", "GUARD_APPROVED",
  "GUARD_BLOCKED", "EXECUTION_STARTED", "EXECUTION_SUCCEEDED", "EXECUTION_FAILED",
  "REPLAN_TRIGGERED", "HUMAN_ESCALATION", "CASE_RECOVERED", "CASE_CLOSED",
];

const DECISION_SOURCES = ["", "AI", "GUARD", "HUMAN", "SYSTEM", "WORKER"];

const SOURCE_COLOR: Record<string, "positive" | "negative" | "notice" | "information" | "neutral"> = {
  AI: "information",
  GUARD: "notice",
  HUMAN: "positive",
  SYSTEM: "neutral",
  WORKER: "neutral",
};

const EVENT_COLOR: Record<string, "positive" | "negative" | "notice" | "information" | "neutral"> = {
  CASE_RECOVERED: "positive",
  GUARD_APPROVED: "positive",
  EXECUTION_SUCCEEDED: "positive",
  GUARD_BLOCKED: "negative",
  EXECUTION_FAILED: "negative",
  HUMAN_ESCALATION: "notice",
  REPLAN_TRIGGERED: "notice",
  ACTION_PROPOSED: "information",
  COUNCIL_STARTED: "information",
  EXECUTION_STARTED: "information",
  CASE_CREATED: "neutral",
  CASE_CLOSED: "neutral",
};

function AuditContent() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const totalPages = Math.ceil(total / LIMIT);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: LIMIT, offset: (page - 1) * LIMIT };
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      if (sourceFilter) params.decision_source = sourceFilter;
      const res = await authFetch(API.audit(params));
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      setEvents(data.items || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, sourceFilter, page]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  return (
    <AppShell>
      <Box padding="spacing.8">
        <div className="hide-on-mobile">
          <Box marginBottom="spacing.8">
            <Heading size="xlarge" weight="semibold">Audit Log</Heading>
            <Text color="surface.text.gray.muted" marginTop="spacing.1">
              Immutable timeline of all system and human actions
            </Text>
          </Box>
        </div>

        {/* Filters */}
        <Box display="flex" gap="spacing.4" marginBottom="spacing.5" alignItems="center" flexWrap="wrap">
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
                  onChange={({ value }: { value?: string }) => setFilterSearch(value || "")}
                />
                <Box marginTop="spacing.4" maxHeight="200px" overflow="auto">
                  {EVENT_TYPES.filter(s => (s || "All Events").toLowerCase().includes(filterSearch.toLowerCase())).map((s) => (
                    <div
                      key={s}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        backgroundColor: eventTypeFilter === s ? "#f0f7ff" : "transparent",
                        borderRadius: "4px"
                      }}
                      onClick={() => {
                        setEventTypeFilter(s);
                        setPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      <Text
                        color={eventTypeFilter === s ? "interactive.text.primary.normal" : "surface.text.gray.normal"}
                        weight={eventTypeFilter === s ? "semibold" : "regular"}
                      >
                        {s || "All Events"}
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
              placeholder="Search by case ID, actor, etc..."
              value={globalSearch}
              onChange={({ value }: { value?: string }) => setGlobalSearch(value || "")}
            />
          </Box>
          <Box display="flex" alignItems="flex-end" marginLeft="auto">
            <Text size="small" color="surface.text.gray.muted">{total.toLocaleString()} events</Text>
          </Box>
        </Box>

        {error && <Alert color="negative" description={error} marginBottom="spacing.5" isFullWidth />}

        <Box
          backgroundColor="surface.background.gray.subtle"
          borderRadius="medium"
          borderWidth="thin"
          borderColor="surface.border.gray.muted"
          overflow="hidden"
          width="100%"
        >
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "800px" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1.2fr 2fr 1fr 1fr", background: "var(--blade-color-surface-background-gray-intense, #f3f4f6)", padding: "8px 20px", borderBottom: "1px solid #e5e7eb" }}>
                {["Timestamp", "Event", "Case", "Actor", "Source"].map((h) => (
                  <Text key={h} size="xsmall" weight="semibold" color="surface.text.gray.muted">{h.toUpperCase()}</Text>
                ))}
              </div>

          {loading ? (
            <Box display="flex" justifyContent="center" padding="spacing.10">
              <Spinner accessibilityLabel="Loading audit log..." />
            </Box>
          ) : events.length === 0 ? (
            <Box padding="spacing.10" textAlign="center">
              <Text color="surface.text.gray.muted">
                No audit events found. {eventTypeFilter ? "Try clearing the filter." : "Simulate a payment to generate audit events."}
              </Text>
            </Box>
          ) : (
            events.map((e, i) => (
              <Box key={e.id}>
                {i > 0 && <Divider />}
                <div style={{ display: "grid", gridTemplateColumns: "100px 1.2fr 2fr 1fr 1fr", padding: "10px 20px", alignItems: "center" }}>
                  <Text size="xsmall" color="surface.text.gray.muted">
                    {timeAgo(e.timestamp)}
                  </Text>
                  <Badge size="small" color={EVENT_COLOR[e.event_type] || "neutral"}>
                    {e.event_type}
                  </Badge>
                  <Text size="xsmall" color="interactive.text.primary.normal">
                    {e.case_id ? e.case_id.slice(0, 20) + "…" : "—"}
                  </Text>
                  <Text size="xsmall" color="surface.text.gray.muted">{e.actor}</Text>
                  <Badge size="small" color={SOURCE_COLOR[e.decision_source] || "neutral"}>
                    {e.decision_source}
                  </Badge>
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
              <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Prev
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

export default function AuditPage() {
  return <Suspense fallback={null}><AuditContent /></Suspense>;
}
