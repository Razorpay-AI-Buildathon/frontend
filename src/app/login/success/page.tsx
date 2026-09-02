"use client";

import React, { useEffect, useState } from "react";
import { Box, Heading, Text, Button } from "@razorpay/blade/components";
import styled, { keyframes } from "styled-components";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

const pulseOrb = keyframes`
  0% { transform: scale(0.8) translate(-50%, -50%); opacity: 0.5; }
  50% { transform: scale(1.2) translate(-40%, -60%); opacity: 0.8; }
  100% { transform: scale(0.8) translate(-50%, -50%); opacity: 0.5; }
`;

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeInUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const OrbBackground = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(56, 189, 248, 0) 70%);
  filter: blur(40px);
  animation: ${pulseOrb} 6s infinite ease-in-out;
  transform-origin: top left;
  z-index: 0;
  pointer-events: none;
`;

const AnimatedCheckCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #dcfce7; /* Tailwind green-100 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  animation: ${popIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
`;

const AnimatedContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  gap: 24px;
  max-width: 400px;
  text-align: center;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
`;

export default function LoginSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/overview");
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      backgroundColor="surface.background.gray.subtle"
      position="relative"
      overflow="hidden"
    >
      {/* Mocking the Rzp Glass Success Animation */}
      <OrbBackground />

      <AnimatedContent>
        <AnimatedCheckCircle>
          <Check size={24} color="#166534" /> {/* Use a dark green for the check */}
        </AnimatedCheckCircle>

        <Heading size="2xlarge" weight="semibold">
          You're officially in!
        </Heading>

        <Text size="medium" color="surface.text.gray.muted" textAlign="center">
          Now relax while the formal checks happen. We're sending a little cheer your way in the meantime.
        </Text>

        <Box width="100%" marginTop="spacing.4">
          <Button
            size="large"
            isFullWidth
            onClick={() => router.push("/overview")}
            variant="primary"
          >
            Lets! Get Started
          </Button>
        </Box>

        <Text size="small" color="surface.text.gray.muted" marginTop="spacing.3">
          Redirecting to your Razorpay home in {countdown} seconds
        </Text>
      </AnimatedContent>
    </Box>
  );
}
