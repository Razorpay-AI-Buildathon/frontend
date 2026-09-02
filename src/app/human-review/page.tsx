"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Alert,
  Spinner,
  Divider,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@razorpay/blade/components";
import { CheckCircle } from "lucide-react";
import AppShell from "@/components/AppShell";
import { API, DEFAULT_API_KEY, formatINR, STATUS_COLOR, timeAgo } from "@/lib/api";
import { useSSE } from "@/lib/sse";

interface HumanReviewCase {
  case_id: string;
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
  audit_log: any[];
  actions: any[];
}

type ReviewDecision = "APPROVE" | "REJECT" | "CLOSE";

export default function HumanReviewPage() {
  const router = useRouter();
  const [cases, setCases] = useState<HumanReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HumanReviewCase | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      const res = await fetch(API.cases({ status: "HUMAN_REVIEW", page: 1, page_size: 50 }), {
        headers: { "X-API-Key": DEFAULT_API_KEY },
      });
      if (!res.ok) throw new Error("Failed to load human review cases");
      const data = await res.json();
      setCases(data.items || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);
  useSSE((ev) => {
    if (["HUMAN_REVIEW", "CASE_UPDATED", "CASE_CREATED"].includes(ev.type)) loadCases();
  });

  const openDetail = async (c: HumanReviewCase) => {
    // Load full detail
    const res = await fetch(API.case(c.case_id), { headers: { "X-API-Key": DEFAULT_API_KEY } });
    if (res.ok) setSelected(await res.json());
    else setSelected(c);
  };

  const handleDecision = async (decision: ReviewDecision) => {
    if (!selected) return;
    setDeciding(true);
    try {
      const res = await fetch(API.caseReview(selected.case_id), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": DEFAULT_API_KEY },
        body: JSON.stringify({ decision, notes: `Human operator decision: ${decision}` }),
      });
      if (!res.ok) throw new Error(`Decision failed: ${res.status}`);
      setSuccessMsg(`Case ${decision.toLowerCase()}d successfully.`);
      setSelected(null);
      loadCases();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <AppShell>
      <Box padding="spacing.8">
        <div className="hide-on-mobile">
          <Box marginBottom="spacing.8">
            <Heading size="xlarge" weight="semibold">Human Review</Heading>
            <Text color="surface.text.gray.muted" marginTop="spacing.1">
              Cases escalated for manual operator intervention
            </Text>
          </Box>
        </div>

        {successMsg && (
          <Alert color="positive" description={successMsg} marginBottom="spacing.5" isFullWidth
            onDismiss={() => setSuccessMsg(null)} />
        )}
        {error && <Alert color="negative" description={error} marginBottom="spacing.5" isFullWidth />}

        {loading ? (
          <Box display="flex" justifyContent="center" padding="spacing.10">
            <Spinner accessibilityLabel="Loading review queue..." size="large" />
          </Box>
        ) : cases.length === 0 ? (
          <Box
            backgroundColor="surface.background.gray.subtle"
            borderRadius="medium"
            borderWidth="thin"
            borderColor="surface.border.gray.muted"
            padding="spacing.10"
            textAlign="center"
          >
            <Box display="flex" justifyContent="center" marginBottom="spacing.3">
              <CheckCircle size={32} color="#10b981" />
            </Box>
            <Heading size="medium" marginBottom="spacing.2">No cases pending review</Heading>
            <Text color="surface.text.gray.muted">All cases have been processed by ActionGuard automatically.</Text>
          </Box>
        ) : (
          <Box
            backgroundColor="surface.background.gray.subtle"
            borderRadius="medium"
            borderWidth="thin"
            borderColor="surface.border.gray.muted"
          >
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr 80px", background: "#f3f4f6", padding: "8px 20px", borderBottom: "1px solid #e5e7eb" }}>
              {["Case", "Amount", "Escalation Reason", "Risk", "Recommended Action", "Guard Result", "Age"].map((h) => (
                <Text key={h} size="xsmall" weight="semibold" color="surface.text.gray.muted">{h.toUpperCase()}</Text>
              ))}
            </div>

            {cases.map((c, i) => {
              const latestAction = c.actions?.[c.actions?.length - 1];
              const escalationReason = c.audit_log?.find((e: any) => e.event === "HUMAN_ESCALATION")?.inputs?.reason || "Policy conflict";
              return (
                <Box key={c.case_id}>
                  {i > 0 && <Divider />}
                  <div
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr 80px", cursor: "pointer", padding: "14px 20px", alignItems: "center" }}
                    onClick={() => openDetail(c)}
                  >
                    <div>
                      <Text size="small" color="interactive.text.primary.normal" weight="semibold">
                        {c.case_id.slice(0, 16)}…
                      </Text>
                    </div>
                    <Text size="small" weight="semibold">₹{Number(c.amount).toLocaleString()}</Text>
                    <Text size="small" color="surface.text.gray.muted">{String(escalationReason).slice(0, 30)}</Text>
                    <Badge size="small" color={c.priority_score > 60 ? "negative" : c.priority_score > 30 ? "notice" : "positive"}>
                      {c.priority_score > 60 ? "HIGH" : c.priority_score > 30 ? "MEDIUM" : "LOW"}
                    </Badge>
                    <Text size="small">{latestAction?.action_type?.replace(/_/g, " ") || "—"}</Text>
                    <Badge size="small" color={latestAction?.state === "BLOCKED" ? "negative" : "notice"}>
                      {latestAction?.state || "PENDING"}
                    </Badge>
                    <Text size="xsmall" color="surface.text.gray.muted">{timeAgo(c.created_at)}</Text>
                  </div>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onDismiss={() => setSelected(null)} size="large">
          <ModalHeader
            title={`Human Review: ${selected.case_id.slice(0, 24)}…`}
            subtitle={`Amount: ₹${Number(selected.amount).toLocaleString()} · Status: ${selected.status}`}
          />
          <ModalBody>
            <Box display="flex" flexDirection="column" gap="spacing.5">
              <Alert
                color="notice"
                title="Operator Decision Required"
                description="ActionGuard has escalated this case for human review. Your decision will be recorded in the audit log."
                isFullWidth
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <DetailField label="Escalation Reason" value={String((selected as any).audit_log?.find((e: any) => e.event === "HUMAN_ESCALATION")?.inputs?.reason || "Policy conflict / Risk threshold exceeded")} />
                <DetailField label="Risk Score" value={`Priority: ${selected.priority_score}`} />
                <DetailField label="Retry Budget" value={`${selected.current_recovery_attempt} / 3 used`} />
                <DetailField label="Confidence" value={selected.confidence > 0 ? `${(selected.confidence * 100).toFixed(0)}%` : "—"} />
                <DetailField label="Expected Recovery" value={formatINR(selected.expected_recovery_value)} />
                <DetailField label="Guard Result" value={selected.actions?.[selected.actions.length - 1]?.state || "—"} />
              </div>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Box display="flex" gap="spacing.3" justifyContent="flex-end">
              <Button variant="tertiary" onClick={() => setSelected(null)} isDisabled={deciding}>Cancel</Button>
              <Button variant="secondary" color="negative" onClick={() => handleDecision("CLOSE")} isDisabled={deciding}>Close Case</Button>
              <Button variant="secondary" color="negative" onClick={() => handleDecision("REJECT")} isDisabled={deciding}>Reject</Button>
              <Button variant="primary" onClick={() => handleDecision("APPROVE")} isDisabled={deciding}>
                {deciding ? "Processing..." : "Approve"}
              </Button>
            </Box>
          </ModalFooter>
        </Modal>
      )}
    </AppShell>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xsmall" weight="semibold" color="surface.text.gray.muted" marginBottom="spacing.1">{label.toUpperCase()}</Text>
      <Text size="small">{value}</Text>
    </Box>
  );
}
