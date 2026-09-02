"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Text,
  Heading,
  Divider,
  Badge,
  Avatar,
  Button,
} from "@razorpay/blade/components";
import { LayoutDashboard, ClipboardList, Zap, CheckCircle, X, UserCheck, Target, TrendingUp, Search } from "lucide-react";
import { logout } from "@/lib/auth";
import { API, DEFAULT_API_KEY } from "@/lib/api";

interface GatewayStatus {
  mode?: string;
  environment?: string;
  health?: string;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Recovery Cases", href: "/recovery", icon: ClipboardList },
  { label: "Human Review", href: "/human-review", icon: UserCheck },
  { label: "Strategies", href: "/strategies", icon: Target },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Audit Log", href: "/audit", icon: Search },
];

export default function Sidebar({ 
  userName, 
  userEmail, 
  userRole, 
  onClose 
}: { 
  userName?: string; 
  userEmail?: string; 
  userRole?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({});

  useEffect(() => {
    fetch(API.metrics(), { headers: { "X-API-Key": DEFAULT_API_KEY } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.gateway_mode) setGatewayStatus({ mode: d.gateway_mode, environment: d.environment || "DEMO", health: "HEALTHY" });
        else setGatewayStatus({ mode: "SIMULATION", environment: "DEMO", health: "HEALTHY" });
      })
      .catch(() => setGatewayStatus({ mode: "SIMULATION", environment: "DEMO", health: "HEALTHY" }));
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return pathname === base || (base !== "/" && pathname.startsWith(base));
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.4)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <style>{`
        .sidebar-close-btn { display: none; }
        @media (max-width: 768px) {
          .sidebar-close-btn { display: block; }
        }
      `}</style>
      {/* Brand */}
      <Box padding="spacing.6" borderBottomWidth="thin" borderBottomColor="surface.border.gray.muted" position="relative">
        {onClose && (
          <button 
            className="sidebar-close-btn"
            onClick={onClose}
            style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={24} color="#374151" />
          </button>
        )}
        <Heading size="medium" color="surface.text.gray.normal" weight="semibold">
          RecoverAI
        </Heading>
        <Text size="xsmall" color="surface.text.gray.muted" marginTop="spacing.1">
          Payment Recovery Operations
        </Text>
        <Box display="flex" flexWrap="wrap" gap="spacing.2" marginTop="spacing.3">
          <Badge
            size="small"
            color={gatewayStatus.mode === "RAZORPAY_TEST" ? "notice" : "information"}
          >
            {gatewayStatus.mode === "RAZORPAY_TEST" ? "RAZORPAY TEST" : "SIMULATION"}
          </Badge>
          <Badge size="small" color="positive">
            {gatewayStatus.health || "HEALTHY"}
          </Badge>
        </Box>
      </Box>

      {/* Navigation */}
      <Box flex="1" padding="spacing.4">
        <Text size="xsmall" color="surface.text.gray.muted" weight="semibold" marginBottom="spacing.2">
          OVERVIEW
        </Text>
        {NAV_ITEMS.slice(0, 1).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <Text size="xsmall" color="surface.text.gray.muted" weight="semibold" marginTop="spacing.5" marginBottom="spacing.2">
          RECOVERY
        </Text>
        {NAV_ITEMS.slice(1, 5).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <Box marginY="spacing.4">
          <Divider />
        </Box>

        {NAV_ITEMS.slice(5).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </Box>

      {/* User section */}
      <Box
        padding="spacing.4"
        borderTopWidth="thin"
        borderTopColor="surface.border.gray.muted"
      >
        <Box display="flex" alignItems="center" gap="spacing.3" marginBottom="spacing.4">
          <Avatar name={userName || "Operator"} size="medium" />
          <Box overflow="hidden">
            <Text size="small" weight="semibold" color="surface.text.gray.normal" truncateAfterLines={1}>
              {userName || "Operator"}
            </Text>
            <Text size="xsmall" color="surface.text.gray.muted" truncateAfterLines={1}>
              {userEmail || ""}
            </Text>
            {userRole && (
              <Badge size="small" color="neutral" marginTop="spacing.1">
                {userRole}
              </Badge>
            )}
          </Box>
        </Box>
        <Button
          variant="tertiary"
          size="small"
          isFullWidth
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </Box>
    </div>
  );
}

function NavLink({ item, active }: { item: { label: string; href: string; icon: React.ElementType }; active: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderRadius: "9999px",
        marginBottom: "4px",
        textDecoration: "none",
        background: active ? "rgba(255, 255, 255, 0.8)" : "transparent",
        color: active ? "#0f172a" : "#475569",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
        fontSize: "14px",
        fontWeight: active ? 600 : 500,
        transition: "all 0.2s ease",
      }}
    >
      <item.icon size={18} style={{ minWidth: "18px", color: active ? "#2563eb" : "#64748b" }} />
      {item.label}
    </Link>
  );
}
