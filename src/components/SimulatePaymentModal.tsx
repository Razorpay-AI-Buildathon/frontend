"use client";

import React, { useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  Alert,
} from "@razorpay/blade/components";
import { API, DEFAULT_API_KEY } from "@/lib/api";

const FAILURE_REASONS = [
  "insufficient_funds",
  "card_declined",
  "bank_timeout",
  "card_expired",
  "authentication_failed",
  "network_error",
  "do_not_honor",
  "invalid_cvv",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (caseId?: string) => void;
}

export default function SimulatePaymentModal({ isOpen, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("2000");
  const [failureReason, setFailureReason] = useState("insufficient_funds");
  const [successRate, setSuccessRate] = useState("0.95");
  const [riskBand, setRiskBand] = useState("LOW");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 1) { setError("Amount must be at least ₹1"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.ingestPayment(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": DEFAULT_API_KEY },
        body: JSON.stringify({
          event_id: `evt-sim-${Date.now()}`,
          merchant_id: "demo-merchant",
          customer_id: `demo-cust-${Date.now()}`,
          event_type: "FAILED_PAYMENT",
          amount: amtNum,
          currency: "INR",
          failure_code: failureReason,
          provider: "simulation",
          metadata: {
            customer_email: "demo@recoverai.com",
            risk_band: riskBand,
            payment_history_success_rate: parseFloat(successRate),
            simulated: true,
          },
        }),
      });
      if (!res.ok) throw new Error(`Simulation failed: ${res.status}`);
      const data = await res.json();
      onSuccess(data.case_id);
    } catch (e: any) {
      setError(e.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999, background: "rgba(0,0,0,0.5)"
      }}
    >
      <Box
        backgroundColor="surface.background.gray.subtle"
        borderRadius="medium"
        borderWidth="thin"
        borderColor="surface.border.gray.muted"
        padding="spacing.8"
        width="100%"
        maxWidth="480px"
        display="flex"
        flexDirection="column"
        gap="spacing.5"
      >
        <Box>
          <Text size="large" weight="semibold">Simulate Failed Payment</Text>
          <Text size="small" color="surface.text.gray.muted" marginTop="spacing.1">
            Create a real recovery case through the AI pipeline
          </Text>
        </Box>

        {error && <Alert color="negative" description={error} isFullWidth />}

        <TextInput
          label="Amount (₹)"
          value={amount}
          onChange={({ value }) => setAmount(value || "")}
          prefix="₹"
          type="number"
          isRequired
          necessityIndicator="required"
        />

        <Box>
          <Text size="small" weight="semibold" marginBottom="spacing.2">Failure Reason</Text>
          <select
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", background: "white" }}
          >
            {FAILURE_REASONS.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </Box>

        <Box>
          <Text size="small" weight="semibold" marginBottom="spacing.2">Customer History</Text>
          <select value={successRate} onChange={(e) => setSuccessRate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", background: "white" }}>
            <option value="0.95">95% — Excellent</option>
            <option value="0.80">80% — Good</option>
            <option value="0.60">60% — Average</option>
            <option value="0.30">30% — Poor</option>
          </select>
        </Box>

        <Box>
          <Text size="small" weight="semibold" marginBottom="spacing.2">Risk Band</Text>
          <select value={riskBand} onChange={(e) => setRiskBand(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", background: "white" }}>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </Box>

        <Box backgroundColor="surface.background.gray.intense" borderRadius="small" padding="spacing.4">
          <Text size="xsmall" color="surface.text.gray.muted" weight="semibold">GATEWAY</Text>
          <Text size="small" marginTop="spacing.1">Simulation Mode (no real payment processed)</Text>
        </Box>

        <Box display="flex" gap="spacing.3" justifyContent="flex-end">
          <Button variant="secondary" onClick={onClose} isDisabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isDisabled={loading}>
            {loading ? "Simulating..." : "Simulate Payment Failure"}
          </Button>
        </Box>
      </Box>
    </div>
  );
}
