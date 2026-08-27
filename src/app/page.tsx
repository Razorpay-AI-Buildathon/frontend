/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles,
  Info,
  DollarSign
} from "lucide-react";

interface Metrics {
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  action_success_rate: number;
  guard_block_rate: number;
  human_escalation_rate: number;
  backend_action_agreement?: number;
  council_action_agreement?: number;
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

interface AuditLogEntry {
  timestamp: string;
  node: string;
  event: string;
  inputs?: any;
  outputs?: any;
  decision?: string;
  confidence?: number;
  decision_source?: string;
  model?: string;
  request_id?: string;
  playbook_id?: string;
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
  audit_log: AuditLogEntry[];
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

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  
  // API Key inputs (no hardcoded credentials)
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [activeApiKey, setActiveApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingCases, setLoadingCases] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Dynamic API base URL configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  // Fetch Metrics
  useEffect(() => {
    if (!activeApiKey) {
      setMetrics(null);
      setLoadingMetrics(false);
      return;
    }

    const controller = new AbortController();
    setLoadingMetrics(true);
    setErrorMessage("");

    fetch(`${API_BASE_URL}/api/metrics`, {
      headers: {
        "X-API-Key": activeApiKey
      },
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Authentication failed: Invalid credentials.");
          }
          throw new Error(`Server returned status code: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setMetrics(data))
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Error loading metrics:", err);
          setMetrics(null);
          setErrorMessage(`Connection Error: Unable to reach metrics endpoints at ${API_BASE_URL}`);
        }
      })
      .finally(() => setLoadingMetrics(false));

    return () => controller.abort();
  }, [activeApiKey, API_BASE_URL]);

  // Fetch Cases list
  useEffect(() => {
    if (!activeApiKey) {
      setCases([]);
      setCaseDetail(null);
      setTotalPages(1);
      return;
    }

    const controller = new AbortController();
    setLoadingCases(true);
    setErrorMessage("");

    let url = `${API_BASE_URL}/api/cases?page=${page}&page_size=8`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (riskFilter) url += `&risk_level=${riskFilter}`;

    fetch(url, {
      headers: {
        "X-API-Key": activeApiKey
      },
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Authentication failed: Access denied.");
          }
          throw new Error(`Failed to load cases: HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setCases(data.items);
        setTotalPages(Math.ceil(data.total / 8));
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Error loading cases:", err);
          setErrorMessage(err.message || "Failed to load cases from server.");
          setCases([]);
          setCaseDetail(null);
          setTotalPages(1);
        }
      })
      .finally(() => setLoadingCases(false));

    return () => controller.abort();
  }, [page, statusFilter, riskFilter, activeApiKey, API_BASE_URL]);

  // Fetch Case Details
  useEffect(() => {
    if (!selectedCaseId || !activeApiKey) {
      setCaseDetail(null);
      return;
    }

    const controller = new AbortController();
    setLoadingDetail(true);

    fetch(`${API_BASE_URL}/api/cases/${selectedCaseId}`, {
      headers: {
        "X-API-Key": activeApiKey
      },
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error("Case details failed to load");
        return res.json();
      })
      .then(data => setCaseDetail(data))
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("Error loading details:", err);
        }
      })
      .finally(() => setLoadingDetail(false));

    return () => controller.abort();
  }, [selectedCaseId, activeApiKey, API_BASE_URL]);

  const getRiskColor = (score: number) => {
    if (score < 40) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score < 70) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded text-xs font-mono font-medium border uppercase tracking-wide ";
    switch (status) {
      case "RECOVERED":
        return base + "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "FAILED":
        return base + "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "EXECUTING":
        return base + "text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse";
      case "GUARD_REVIEW":
        return base + "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "APPROVED":
        return base + "text-teal-400 bg-teal-500/10 border-teal-500/20";
      case "HUMAN_REVIEW":
        return base + "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "BLOCKED":
        return base + "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "IDENTIFIED":
        return base + "text-slate-400 bg-slate-500/10 border-slate-500/20";
      case "ANALYZING":
        return base + "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "ACTION_PROPOSED":
        return base + "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      default:
        return base + "text-plum bg-border-beige/10 border-border-beige/20";
    }
  };

  const getMaskedToken = (token: string | null) => {
    if (!token) return "NONE";
    if (token.length <= 15) return "PRESENT";
    return `${token.substring(0, 10)}••••••••${token.substring(token.length - 6)}`;
  };

  const handleApplyApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveApiKey(apiKeyInput.trim());
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header bar */}
      <header className="border-b border-border-beige bg-card-bg px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">RecoverAI Dashboard</h1>
          </div>
          <p className="text-xs text-plum mt-0.5">Live observability of the deterministic safety policies & payment recovery graph</p>
        </div>

        {/* Api key control form to prevent keystroke requests */}
        <form onSubmit={handleApplyApiKey} className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-background border border-border-beige rounded px-3 py-1.5 w-full md:w-auto">
            <Lock size={14} className="text-plum" />
            <input 
              type={showApiKey ? "text" : "password"} 
              value={apiKeyInput} 
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="bg-transparent text-xs font-mono border-none focus:outline-none w-40 text-foreground"
              placeholder="Enter Server API Key..."
            />
            <button 
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-plum hover:text-foreground transition-colors"
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button 
            type="submit"
            className="px-3 py-1.5 bg-accent hover:bg-accent/80 transition-colors text-xs font-mono rounded font-medium text-white"
          >
            Apply
          </button>
        </form>
      </header>

      {/* Main console content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Error notification display */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono flex items-center gap-2 animate-fade-in">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stats Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card-bg border border-border-beige p-4 rounded space-y-1">
            <div className="flex items-center justify-between text-plum">
              <span className="text-xs font-mono uppercase tracking-wider">Revenue at Risk (INR)</span>
              <Activity size={14} className="text-accent" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {loadingMetrics ? "..." : `₹${metrics?.revenue_at_risk.toLocaleString('en-IN')}`}
            </p>
          </div>

          <div className="bg-card-bg border border-border-beige p-4 rounded space-y-1">
            <div className="flex items-center justify-between text-plum">
              <span className="text-xs font-mono uppercase tracking-wider">Revenue Recovered (INR)</span>
              <TrendingUp size={14} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success font-mono">
              {loadingMetrics ? "..." : `₹${metrics?.revenue_recovered.toLocaleString('en-IN')}`}
            </p>
          </div>

          <div className="bg-card-bg border border-border-beige p-4 rounded space-y-1">
            <div className="flex items-center justify-between text-plum">
              <span className="text-xs font-mono uppercase tracking-wider">Recovery Rate</span>
              <CheckCircle2 size={14} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success font-mono">
              {loadingMetrics ? "..." : `${metrics?.recovery_rate}%`}
            </p>
          </div>

          <div className="bg-card-bg border border-border-beige p-4 rounded space-y-1">
            <div className="flex items-center justify-between text-plum">
              <span className="text-xs font-mono uppercase tracking-wider">Guard Block Rate</span>
              <ShieldAlert size={14} className="text-error" />
            </div>
            <p className="text-2xl font-bold text-error font-mono">
              {loadingMetrics ? "..." : `${metrics?.guard_block_rate}%`}
            </p>
          </div>
        </section>

        {/* Dashboard split screen layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel - Cases List */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-plum">Recovery Cases Queue</h2>
              
              {/* Filters strip */}
              <div className="flex gap-2 w-full sm:w-auto">
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-card-bg border border-border-beige rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="IDENTIFIED">Identified</option>
                  <option value="ANALYZING">Analyzing</option>
                  <option value="ACTION_PROPOSED">Action Proposed</option>
                  <option value="GUARD_REVIEW">Guard Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="EXECUTING">Executing</option>
                  <option value="RECOVERED">Recovered</option>
                  <option value="FAILED">Failed</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="HUMAN_REVIEW">Human Review</option>
                </select>

                <select 
                  value={riskFilter} 
                  onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
                  className="bg-card-bg border border-border-beige rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="">All Risk levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>

            {/* Cases Table */}
            <div className="bg-card-bg border border-border-beige rounded overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-border-beige/30 border-b border-border-beige text-plum font-mono uppercase tracking-wider">
                      <th className="p-3">Case ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Proposed Action</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-beige">
                    {!activeApiKey ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-plum font-mono">
                          Please enter and apply the Server API Key to unlock cases data.
                        </td>
                      </tr>
                    ) : loadingCases ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-plum font-mono">Loading cases...</td>
                      </tr>
                    ) : cases.length > 0 ? (
                      cases.map((c) => (
                        <tr 
                          key={c.case_id} 
                          onClick={() => setSelectedCaseId(c.case_id)}
                          className={`hover:bg-accent-light/10 transition-colors cursor-pointer ${selectedCaseId === c.case_id ? "bg-accent-light/20" : ""}`}
                        >
                          <td className="p-3 font-mono font-medium text-accent flex items-center gap-1.5">
                            {c.case_id.substring(0, 12)}...
                            <ArrowUpRight size={10} className="opacity-40" />
                          </td>
                          <td className="p-3 font-mono font-semibold">
                            {c.currency} {parseFloat(c.amount as any).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(c.priority_score)}`}>
                              {c.priority_score}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-plum">
                            {c.proposed_action ? c.proposed_action.replace(/_/g, " ") : "DO NOTHING"}
                          </td>
                          <td className="p-3">
                            <span className={getStatusBadge(c.status)}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-plum font-mono">No cases found matching filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-border-beige flex justify-between items-center bg-border-beige/10">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded border border-border-beige text-xs bg-card-bg hover:bg-border-beige/20 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono text-plum">Page {page} of {totalPages}</span>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded border border-border-beige text-xs bg-card-bg hover:bg-border-beige/20 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Right panel - Case Details & Decision Trace */}
          <section className="lg:col-span-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-plum">Observability & Decision Trace</h2>
            
            {loadingDetail ? (
              <div className="bg-card-bg border border-border-beige p-8 rounded text-center text-plum font-mono">
                Loading case metrics and provenance trace...
              </div>
            ) : caseDetail ? (
              <div className="space-y-6">
                
                {/* Basic Metadata card */}
                <div className="bg-card-bg border border-border-beige p-4 rounded space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-plum">CASE ID: {caseDetail.case_id}</span>
                    <span className={getStatusBadge(caseDetail.status)}>{caseDetail.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border-beige/50 py-3">
                    <div>
                      <p className="text-[10px] uppercase font-mono text-plum">Amount at Risk</p>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {caseDetail.currency} {parseFloat(caseDetail.amount as any).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono text-plum">Expected Recovery</p>
                      <p className="text-sm font-bold font-mono text-success mt-0.5">
                        {caseDetail.currency} {parseFloat(caseDetail.expected_recovery_value as any).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-plum">Attempt Number:</span>
                    <span className="font-mono text-foreground font-semibold">{caseDetail.current_recovery_attempt}</span>
                  </div>
                </div>

                {/* Token authorizations list displaying action_id, execution_id, and masked token values */}
                {caseDetail.actions.length > 0 && (
                  <div className="bg-card-bg border border-border-beige p-4 rounded space-y-3">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-plum flex items-center gap-1.5">
                      <Lock size={12} className="text-accent" /> Security Authorizations
                    </p>
                    <div className="space-y-3">
                      {caseDetail.actions.map(action => (
                        <div key={action.id} className="text-[11px] bg-background border border-border-beige p-3 rounded font-mono space-y-2">
                          <div className="flex justify-between">
                            <span className="text-foreground font-semibold">{action.action_type}</span>
                            <span className="text-teal-400 uppercase font-bold">{action.state}</span>
                          </div>
                          
                          <div className="text-[10px] text-plum flex flex-col gap-1 pt-1.5 border-t border-border-beige/50">
                            {action.action_id && (
                              <div className="flex justify-between">
                                <span>ACTION ID:</span>
                                <span className="text-foreground font-semibold">{action.action_id.substring(0, 18)}...</span>
                              </div>
                            )}
                            {action.execution_id && (
                              <div className="flex justify-between">
                                <span>EXECUTION ID:</span>
                                <span className="text-success font-semibold">{action.execution_id}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>AUTH TOKEN:</span>
                              <span className="text-foreground">{getMaskedToken(action.authorization_token)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PROPOSED BY:</span>
                              <span>{action.proposed_by}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit trail / Provenance trace */}
                {caseDetail.audit_log.length > 0 && (
                  <div className="bg-card-bg border border-border-beige p-4 rounded space-y-3">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-plum flex items-center gap-1.5">
                      <Sparkles size={12} className="text-accent" /> Append-Only Audit Log
                    </p>
                    
                    <div className="space-y-4 relative border-l border-border-beige pl-4 ml-2">
                      {caseDetail.audit_log.map((log, idx) => (
                        <div key={idx} className="relative text-xs space-y-1 animate-fade-in">
                          {/* Dot indicator */}
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent border-2 border-card-bg" />
                          
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-foreground uppercase text-[10px] font-mono tracking-wider">
                              {log.node} : {log.event}
                            </span>
                            <span className="text-[9px] font-mono text-plum">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {log.decision_source && (
                            <div className="text-[10px] text-plum font-mono space-y-0.5 bg-background border border-border-beige/50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>SOURCE: {log.decision_source}</span>
                                <span>MODEL: {log.model || "N/A"}</span>
                              </div>
                              {log.playbook_id && <div>PLAYBOOK: {log.playbook_id}</div>}
                              {log.request_id && <div className="truncate">REQUEST ID: {log.request_id}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-card-bg border border-border-beige p-8 rounded text-center text-plum font-mono flex flex-col items-center justify-center gap-2">
                <Info size={24} className="opacity-40" />
                Select a case from the queue list to inspect security authorization tokens, provenance logs, and expected recovery metrics.
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
