"use client";

import React, { useEffect, useState } from "react";
import { Box, Text } from "@razorpay/blade/components";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import AuthGuard from "./AuthGuard";
import Sidebar from "./Sidebar";
import { fetchCurrentUser, User } from "@/lib/auth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle = pathname === '/overview' ? 'Overview' 
    : pathname?.startsWith('/recovery') ? 'Recovery Cases'
    : pathname === '/human-review' ? 'Human Review'
    : pathname === '/strategies' ? 'Strategies'
    : pathname === '/analytics' ? 'Analytics'
    : pathname === '/audit' ? 'Audit Log'
    : 'RecoverAI';

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  return (
    <AuthGuard>
      <style>{`
        .sidebar-container {
          position: fixed;
          top: 0; bottom: 0; left: 0;
          width: 240px;
          z-index: 100;
          transition: transform 0.3s ease;
        }
        .main-content {
          flex: 1;
          margin-left: 240px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
          .sidebar-container {
            transform: translateX(var(--sidebar-translate, -100%));
          }
          .main-content {
            margin-left: 0;
            padding-top: 60px; /* space for mobile header */
          }
          .mobile-header {
            display: flex;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 60px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            z-index: 90;
            align-items: center;
            padding: 0 16px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 40%, #bae6fd 100%)" }}>
        
        <div className="mobile-header">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <Menu size={24} color="#374151" />
          </button>
          <Text weight="semibold" size="large" marginLeft="spacing.4">{pageTitle}</Text>
        </div>

        <div className="sidebar-container" style={{ "--sidebar-translate": isSidebarOpen ? "0%" : "-100%" } as any}>
          <Sidebar
            userName={user?.name}
            userEmail={user?.email}
            userRole={user?.role}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
        
        {/* Main content area */}
        <div className="main-content">
          {children}
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 95 }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
