"use client";

import { useEffect, useRef, useCallback } from "react";
import { API, DEFAULT_API_KEY } from "./api";

export type SSEEvent = {
  type: string;
  case_id?: string;
  status?: string;
  data?: Record<string, unknown>;
};

export function useSSE(
  onEvent: (e: SSEEvent) => void,
  apiKey: string = DEFAULT_API_KEY,
  enabled: boolean = true
) {
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const url = `${API.caseStream()}?api_key=${encodeURIComponent(apiKey)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // Listen to custom events since the backend sends 'event: case_updated'
    es.addEventListener("case_updated", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // Inject the event type so consumers can switch on it
        data.type = "CASE_UPDATED";
        onEventRef.current(data as SSEEvent);
      } catch {
        // ignore malformed events
      }
    });

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as SSEEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 3s
      setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };
  }, [apiKey, enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect, enabled]);
}
