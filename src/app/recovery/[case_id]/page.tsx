/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Alert,
  Spinner,
  Divider,
} from "@razorpay/blade/components";
import { ArrowLeft, Circle, Check, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { API, authFetch, formatINR, STATUS_COLOR, FAILURE_LABELS, timeAgo } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import { motion } from "framer-motion";

interface AuditEntry {
  timestamp: string;
  node: string;
  event: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  decision?: string;
  confidence?: number;
  decision_source?: string;
  model?: string;
}

interface CaseDetail {
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
  audit_log: AuditEntry[];
  created_at: string;
  actions: {
    id: string;
    action_type: string;
    proposed_by: string;
    state: string;
    authorization_token: string | null;
    action_id: string | null;
    execution_id: string | null;
    created_at: string;
  }[];
}

const STATUS_STEPS = [
  "IDENTIFIED", "ANALYZING", "ACTION_PROPOSED", "GUARD_REVIEW",
  "APPROVED", "EXECUTING", "RECOVERED",
];

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.case_id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(0);
  
  const loadCase = useCallback(async () => {
    try {
      const res = await authFetch(API.case(caseId));
      if (res.status === 404) throw new Error("Case not found");
      if (!res.ok) throw new Error(`Failed to load case: ${res.status}`);
      setCaseData(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadCase(); }, [loadCase]);

  useSSE((ev) => {
    if (ev.case_id === caseId && ["CASE_UPDATED", "EXECUTING", "RECOVERED", "FAILED"].includes(ev.type)) {
      loadCase();
    }
  });

  const latestAction = caseData?.actions?.[caseData.actions.length - 1];
  let currentStepIndex = STATUS_STEPS.indexOf(caseData?.status || "");
  if (currentStepIndex === -1 && caseData?.audit_log) {
    const traversedIndices = caseData.audit_log
      .map(log => STATUS_STEPS.indexOf(log.decision || ""))
      .filter(idx => idx !== -1);
    if (traversedIndices.length > 0) {
      currentStepIndex = Math.max(...traversedIndices);
    }
  }
  return (
    <AppShell>
      <Box padding="spacing.8">
        {/* Back */}
        <button onClick={() => router.push("/recovery")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#374151", marginBottom: "20px", fontSize: "14px", fontWeight: 500 }}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Recovery Cases
        </button>

        {loading && (
          <Box display="flex" justifyContent="center" padding="spacing.10">
            <Spinner accessibilityLabel="Loading case..." size="large" />
          </Box>
        )}

        {error && <Alert color="negative" description={error} isFullWidth />}

        {caseData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", alignItems: "start" }}>
              
            {/* ── Left Column ───────────────────────────────── */}
            <Box display="flex" flexDirection="column" gap="spacing.6">
              {/* ── Recovery Timeline (Horizontal) ───────────────────────── */}
              <Section title="Recovery Timeline">
                <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="flex-start" overflow="auto" paddingY="spacing.4">
                  {STATUS_STEPS.map((step, i) => {
                    const reached = currentStepIndex >= i;
                    const active = currentStepIndex === i;
                    const isTerminalException = ["FAILED", "BLOCKED", "CLOSED"].includes(caseData.status);
                    const isWarning = caseData.status === "HUMAN_REVIEW";
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                      >
                        {i > 0 && (
                          <div style={{ 
                            position: 'absolute', top: '14px', left: '-50%', width: '100%', height: '2px', 
                            backgroundColor: reached ? '#10b981' : '#e5e7eb', 
                            zIndex: 0 
                          }} />
                        )}
                        <Box
                          width="28px"
                          height="28px"
                          borderRadius="round"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          backgroundColor={
                            active && isTerminalException ? "feedback.background.negative.intense" :
                            active && isWarning ? "feedback.background.notice.intense" :
                            active ? "feedback.background.information.intense" :
                            reached ? "feedback.background.positive.intense" :
                            "surface.background.gray.intense"
                          }
                          flexShrink={0}
                          zIndex={1}
                        >
                          <Box display="flex" alignItems="center" justifyContent="center">
                            {reached ? (active ? <Circle size={12} fill="white" color="white" /> : <Check size={14} color="white" strokeWidth={3} />) : <Text size="xsmall" color="surface.text.staticWhite.normal" weight="semibold">{String(i + 1)}</Text>}
                          </Box>
                        </Box>
                        <Box marginTop="spacing.3" textAlign="center">
                          <Text
                            size="xsmall"
                            weight={active ? "semibold" : "regular"}
                            color={reached ? "surface.text.gray.normal" : "surface.text.gray.muted"}
                          >
                            {step.replace(/_/g, " ")}
                          </Text>
                          {active && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.1 + 0.2 }}
                            >
                              <Text size="xsmall" color="surface.text.gray.muted">
                                Current state
                              </Text>
                            </motion.div>
                          )}
                        </Box>
                      </motion.div>
                    );
                  })}
                  {(["FAILED", "BLOCKED", "CLOSED", "HUMAN_REVIEW"].includes(caseData.status)) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: STATUS_STEPS.length * 0.1, duration: 0.3 }}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                    >
                      <div style={{ position: 'absolute', top: '14px', left: '-50%', width: '100%', height: '2px', backgroundColor: caseData.status === "HUMAN_REVIEW" ? '#f59e0b' : '#ef4444', zIndex: 0 }} />
                      <Box width="28px" height="28px" borderRadius="round" backgroundColor={caseData.status === "HUMAN_REVIEW" ? "feedback.background.notice.intense" : "feedback.background.negative.intense"} display="flex" alignItems="center" justifyContent="center" flexShrink={0} zIndex={1}>
                        <X size={14} color="white" strokeWidth={3} />
                      </Box>
                      <Box marginTop="spacing.3" textAlign="center">
                        <Text size="xsmall" weight="semibold" color={caseData.status === "HUMAN_REVIEW" ? "feedback.text.notice.intense" : "feedback.text.negative.intense"}>{caseData.status.replace(/_/g, " ")}</Text>
                      </Box>
                    </motion.div>
                  )}
                </Box>
              </Section>

              {/* ── Case Header ─────────────────────────────── */}
              <Section title="Case">
                  <Grid>
                    <Field label="Case ID" value={caseData.case_id} mono />
                    <Field label="Status" value={
                      <Badge size="medium" color={STATUS_COLOR[caseData.status] || "neutral"}>
                        {caseData.status}
                      </Badge>
                    } />
                    <Field label="Amount" value={`₹${Number(caseData.amount).toLocaleString()} ${caseData.currency}`} />
                    <Field label="Priority Score" value={String(caseData.priority_score)} />
                    <Field label="Recovery Attempts" value={String(caseData.current_recovery_attempt)} />
                    <Field label="Expected Recovery" value={formatINR(caseData.expected_recovery_value)} />
                  </Grid>
                </Section>

                {/* ── Payment Event ────────────────────────────── */}
                <Section title="Payment Event">
                  <Grid>
                    <Field label="Event ID" value={caseData.event_id} mono />
                    <Field label="Event Type" value={caseData.event_type} />
                    <Field label="Failure Code" value={FAILURE_LABELS[caseData.failure_code || ""] || caseData.failure_code || "—"} />
                    <Field label="Timestamp" value={timeAgo(caseData.created_at)} />
                  </Grid>
                </Section>

                {/* ── AI Recommendation ──────────────────────── */}
                {latestAction && (
                  <Section title="AI Recommendation">
                    <Alert
                      color="information"
                      title="AI Recommendation — Not an Authorization"
                      description="This recommendation was generated by the Recovery Council AI. Authorization is performed separately by ActionGuard."
                      marginBottom="spacing.4"
                      isFullWidth
                    />
                    <Grid>
                      <Field label="Recommended Action" value={latestAction.action_type.replace(/_/g, " ")} />
                      <Field label="Proposed By" value={latestAction.proposed_by} />
                      <Field label="Confidence" value={
                        (() => {
                          const auditEntry = caseData.audit_log?.find(a => a.confidence !== undefined);
                          return auditEntry ? `${(auditEntry.confidence! * 100).toFixed(0)}%` : "—";
                        })()
                      } />
                      <Field label="Model" value={
                        caseData.audit_log?.find(a => a.model)?.model || "RecoverAI Council"
                      } />
                    </Grid>
                  </Section>
                )}

                {/* ── ActionGuard ─────────────────────────────── */}
                {latestAction && (
                  <Section title="ActionGuard">
                    <Grid>
                      <Field label="Guard Decision" value={
                        <Badge
                          size="medium"
                          color={latestAction.state === "APPROVED" || latestAction.state === "EXECUTED" ? "positive" : latestAction.state === "BLOCKED" ? "negative" : "notice"}
                        >
                          {latestAction.state === "APPROVED" || latestAction.state === "EXECUTED" ? "APPROVED" :
                           latestAction.state === "BLOCKED" ? "BLOCKED" : latestAction.state}
                        </Badge>
                      } />
                      <Field label="Action State" value={latestAction.state} />
                      <Field label="Authorization Token" value={latestAction.authorization_token ? "Present" : "Not issued"} />
                      <Field label="Execution ID" value={latestAction.execution_id || "—"} mono />
                    </Grid>
                  </Section>
                )}

                {/* ── Execution ───────────────────────────────── */}
                {latestAction?.execution_id && (
                  <Section title="Execution">
                    <Grid>
                      <Field label="Execution ID" value={latestAction.execution_id} mono />
                      <Field label="Gateway" value="Razorpay / Simulation" />
                      <Field label="Action ID" value={latestAction.action_id || "—"} mono />
                    </Grid>
                  </Section>
                )}
              </Box>

              {/* ── Right Column ──────────────────────────────── */}
              <Box display="flex" flexDirection="column" gap="spacing.6">
                {/* ── Audit Log ───────────────────────────────── */}
                {caseData.audit_log && caseData.audit_log.length > 0 && (
                  <Section title="Audit Log">
                    <Box display="flex" flexDirection="column" gap="spacing.0">
                      {[...caseData.audit_log].reverse().slice(auditPage * 8, (auditPage + 1) * 8).map((entry, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.3 }}
                        >
                          <Box>
                            {i > 0 && <Divider />}
                            <Box paddingY="spacing.3">
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Text size="small" weight="semibold">{entry.event || entry.node}</Text>
                                  {entry.decision && (
                                    <Text size="xsmall" color="surface.text.gray.muted">
                                      Decision: {entry.decision} {entry.confidence !== undefined ? `(${(entry.confidence * 100).toFixed(0)}% confidence)` : ""}
                                    </Text>
                                  )}
                                  {entry.decision_source && (
                                    <Badge size="small" color="neutral" marginTop="spacing.1">{entry.decision_source}</Badge>
                                  )}
                                </Box>
                                <Text size="xsmall" color="surface.text.gray.muted">
                                  {entry.timestamp ? timeAgo(entry.timestamp) : ""}
                                </Text>
                              </Box>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                      
                      {caseData.audit_log.length > 8 && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" marginTop="spacing.4" paddingTop="spacing.3" borderTopWidth="thin" borderTopColor="surface.border.gray.muted">
                          <Button 
                            variant="tertiary" 
                            isDisabled={auditPage === 0} 
                            onClick={() => setAuditPage(p => p - 1)}
                          >
                            Previous
                          </Button>
                          <Text size="xsmall" color="surface.text.gray.muted">
                            Page {auditPage + 1} of {Math.ceil(caseData.audit_log.length / 8)}
                          </Text>
                          <Button 
                            variant="tertiary" 
                            isDisabled={(auditPage + 1) * 8 >= caseData.audit_log.length} 
                            onClick={() => setAuditPage(p => p + 1)}
                          >
                            Next
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Section>
                )}
              </Box>
            </div>
        )}
      </Box>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      backgroundColor="surface.background.gray.subtle"
      borderRadius="medium"
      borderWidth="thin"
      borderColor="surface.border.gray.muted"
      overflow="hidden"
    >
      <Box
        paddingX="spacing.5"
        paddingY="spacing.3"
        backgroundColor="surface.background.gray.intense"
        borderBottomWidth="thin"
        borderBottomColor="surface.border.gray.muted"
      >
        <Text size="small" weight="semibold" color="surface.text.gray.normal">
          {title}
        </Text>
      </Box>
      <Box padding="spacing.5">{children}</Box>
    </Box>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Box>
      <Text size="xsmall" color="surface.text.gray.muted" weight="semibold" marginBottom="spacing.1">
        {label.toUpperCase()}
      </Text>
      {typeof value === "string" ? (
        mono ? (
          <span style={{ fontFamily: "monospace", wordBreak: "break-all", fontSize: "13px" }}>{value}</span>
        ) : (
          <Text size="small">{value}</Text>
        )
      ) : value}
    </Box>
  );
}
