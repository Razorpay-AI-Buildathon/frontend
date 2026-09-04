"use client";

import React, { useState } from "react";
import { Box, Heading, Text, Button, Alert, Divider } from "@razorpay/blade/components";
import styled from "styled-components";
import { loginWithGoogle } from "@/lib/auth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Use styled-components for custom CSS that Blade Box doesn't support directly
const NoWrapBox = styled(Box)`
  white-space: nowrap;
`;

const WaveBackground = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
  background: linear-gradient(120deg, #f0f7ff 0%, #e0f2fe 30%, #bae6fd 70%, #7dd3fc 100%);
  z-index: 0;

  &::before {
    content: "";
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%);
    opacity: 0.6;
    transform: rotate(30deg);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%, transparent);
    background-size: 100px 100px;
    opacity: 0.1;
  }
`;

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Give the UI a moment to show the loading state before the browser navigates away
    setTimeout(() => {
      loginWithGoogle();
    }, 400);
  };

  return (
    <Box
      display="flex"
      flexDirection={{ base: "column", m: "row" }}
      minHeight="100vh"
      width="100%"
    >
      {/* Left Panel - Branding (Abstract Wave) */}
      <Box
        flex={{ base: "none", m: "6" }}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        padding={{ base: "spacing.8", m: "spacing.11", l: "spacing.11" }}
        minHeight={{ base: "30vh", m: "100vh" }}
        position="relative"
      >
        <WaveBackground />
        
        <Box position="relative" zIndex={1}>
          <Heading size="2xlarge" weight="semibold" color="surface.text.gray.normal" marginTop="spacing.3">
            RecoverAI
          </Heading>
        </Box>

        <Box position="relative" zIndex={1} maxWidth="600px">
          <Heading size="2xlarge" weight="semibold" color="surface.text.gray.normal">
            Supercharge your payment recovery operations.
          </Heading>
          
          <Box display="flex" gap="spacing.6" marginTop="spacing.6">
            <Text size="small" weight="semibold" color="surface.text.gray.muted">✦ AI Diagnostics</Text>
            <Text size="small" weight="semibold" color="surface.text.gray.muted">✦ Automated Execution</Text>
            <Text size="small" weight="semibold" color="surface.text.gray.muted">✦ Human Review</Text>
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        flex={{ base: "none", m: "4" }}
        backgroundColor="surface.background.gray.subtle"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        padding={{ base: "spacing.6", m: "spacing.10" }}
      >
        <Box
          width="100%"
          maxWidth="400px"
          display="flex"
          flexDirection="column"
          gap="spacing.8"
        >
          <Box display="flex" flexDirection="column" gap="spacing.3">
            <Heading size="xlarge" weight="semibold">
              Sign in to RecoverAI
            </Heading>
            <Text size="medium" color="surface.text.gray.muted">
              Authorized operator access only
            </Text>
          </Box>

          {error && (
            <Alert
              color="negative"
              description={
                error === "oauth_failed"
                  ? "Google authentication failed. Please try again."
                  : error === "access_denied"
                  ? "Access denied. Your account is not authorized for this system."
                  : "An authentication error occurred."
              }
              isFullWidth
            />
          )}

          <Box display="flex" flexDirection="column" gap="spacing.5">
            <Button
              size="large"
              isFullWidth
              onClick={handleLogin}
              icon={GoogleIcon}
              iconPosition="left"
              variant="primary"
              isLoading={isLoading}
            >
              Continue with Google
            </Button>
            
            <Box display="flex" alignItems="center" gap="spacing.3">
              <Divider />
              <NoWrapBox flex="none">
                <Text size="xsmall" color="surface.text.gray.muted">
                  or contact administrator
                </Text>
              </NoWrapBox>
              <Divider />
            </Box>
          </Box>

          <Box marginTop="spacing.10">
            <Text size="xsmall" color="surface.text.gray.muted" textAlign="center">
              By continuing you agree to internal security policy and terms of use
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Minimal Google G icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
