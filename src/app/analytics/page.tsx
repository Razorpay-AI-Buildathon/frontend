/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Box,
  Heading,
  Text,
  Badge,
  Alert,
  Spinner,
  Divider,
} from "@razorpay/blade/components";
import AppShell from "@/components/AppShell";
import { API, authFetch, formatINR } from "@/lib/api";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      authFetch(API.metrics()).then(r => r.ok ? r.json() : null),
      authFetch(API.analyticsStrategies()).then(r => r.ok ? r.json() : null),
    ]).then(([m, s]) => {
      setMetrics(m);
      setStrategies(s?.strategies || []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <Box padding="spacing.8">
        <div className="hide-on-mobile">
          <Box marginBottom="spacing.8">
            <Heading size="xlarge" weight="semibold">Analytics</Heading>
            <Text color="surface.text.gray.muted" marginTop="spacing.1">
              Recovery performance across all dimensions
            </Text>
          </Box>
        </div>

        {loading && <Box display="flex" justifyContent="center" padding="spacing.10"><Spinner accessibilityLabel="Loading..." size="large" /></Box>}
        {error && <Alert color="negative" description={error} isFullWidth />}

        {metrics && (
          <Box display="flex" flexDirection="column" gap="spacing.6">
            {/* Key KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
              {[
                { label: "Revenue at Risk", value: formatINR(metrics.revenue_at_risk), color: "feedback.text.negative.intense" },
                { label: "Revenue Recovered", value: formatINR(metrics.revenue_recovered), color: "feedback.text.positive.intense" },
                { label: "Recovery Rate", value: `${metrics.recovery_rate?.toFixed(1)}%`, color: "feedback.text.information.intense" },
                { label: "Action Success Rate", value: `${metrics.action_success_rate?.toFixed(1)}%`, color: "feedback.text.positive.intense" },
                { label: "Guard Block Rate", value: `${metrics.guard_block_rate?.toFixed(1)}%`, color: "feedback.text.notice.intense" },
                { label: "Human Escalation", value: `${metrics.human_escalation_rate?.toFixed(1)}%`, color: "feedback.text.notice.intense" },
                { label: "AI Agreement", value: metrics.council_action_agreement !== undefined ? `${metrics.council_action_agreement?.toFixed(0)}%` : "N/A", color: "feedback.text.information.intense" },
                { label: "Backend Agreement", value: metrics.backend_action_agreement !== undefined ? `${metrics.backend_action_agreement?.toFixed(0)}%` : "N/A", color: "feedback.text.information.intense" },
              ].map(({ label, value, color }) => (
                <Box
                  key={label}
                  backgroundColor="surface.background.gray.subtle"
                  borderRadius="medium"
                  borderWidth="thin"
                  borderColor="surface.border.gray.muted"
                  padding="spacing.5"
                >
                  <Text size="xsmall" color="surface.text.gray.muted" weight="semibold">{label.toUpperCase()}</Text>
                  <Text size="large" weight="semibold" color={color as any} marginTop="spacing.2">{value}</Text>
                </Box>
              ))}
            </div>

            {/* System Health */}
            <Box
              backgroundColor="surface.background.gray.subtle"
              borderRadius="medium"
              borderWidth="thin"
              borderColor="surface.border.gray.muted"
              padding="spacing.6"
            >
              <Heading size="medium" marginBottom="spacing.5">System Health</Heading>
              <Box display="flex" gap="spacing.4" flexWrap="wrap">
                <Badge color="positive" size="medium">ActionGuard: ACTIVE</Badge>
                <Badge color="positive" size="medium">Strategy Engine: ACTIVE</Badge>
                <Badge color="information" size="medium">
                  Gateway: {metrics.gateway_mode === "RAZORPAY_TEST" ? "RAZORPAY TEST" : "SIMULATION"}
                </Badge>
                <Badge color="positive" size="medium">Worker: RUNNING</Badge>
                <Badge color="positive" size="medium">SSE: STREAMING</Badge>
              </Box>
            </Box>

            {/* Strategy breakdown */}
            {strategies.length > 0 && (
              <Box
                backgroundColor="surface.background.gray.subtle"
                borderRadius="medium"
                borderWidth="thin"
                borderColor="surface.border.gray.muted"
                overflow="hidden"
              >
                <Box
                  paddingX="spacing.6"
                  paddingY="spacing.4"
                  borderBottomWidth="thin"
                  borderBottomColor="surface.border.gray.muted"
                >
                  <Heading size="medium">Strategy Breakdown</Heading>
                </Box>
                
                {/* Graphs Section */}
                <Box padding="spacing.6" borderBottomWidth="thin" borderBottomColor="surface.border.gray.muted">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={strategies}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="strategy" axisLine={false} tickLine={false} tickFormatter={(val) => val.replace(/_/g, " ")} style={{ fontSize: '12px', fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#64748B' }} />
                        <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="attempts" name="Total Attempts" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="recovered" name="Successfully Recovered" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Box>

                {strategies.map((s, i) => (
                  <Box key={s.strategy}>
                    {i > 0 && <Divider />}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      paddingX="spacing.6"
                      paddingY="spacing.4"
                    >
                      <Text size="small" weight="semibold">{s.strategy.replace(/_/g, " ")}</Text>
                      <Box display="flex" gap="spacing.4" alignItems="center">
                        <Text size="xsmall" color="surface.text.gray.muted">{s.attempts} attempts</Text>
                        <Text size="xsmall" color="surface.text.gray.muted">{s.recovered} recovered</Text>
                        <Badge size="small" color={s.recovery_rate > 60 ? "positive" : s.recovery_rate > 30 ? "information" : "negative"}>
                          {s.recovery_rate}%
                        </Badge>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
