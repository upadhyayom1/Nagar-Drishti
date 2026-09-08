'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Camera } from '@/types';
import { getWebSocketToken, getWebSocketUrl, type RealtimeEvent } from '@/services/realtime';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export function useRealtime(onStatusChange?: (status: RealtimeStatus) => void) {
  const queryClient = useQueryClient();
  const statusRef = useRef<RealtimeStatus>('disconnected');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let reconnectAttempt = 0;

    const setStatus = (status: RealtimeStatus) => {
      if (statusRef.current === status) return;
      statusRef.current = status;
      onStatusChange?.(status);
    };

    const connect = async () => {
      if (disposed) return;
      setStatus('connecting');

      try {
        const token = await getWebSocketToken();
        if (disposed) return;

        socket = new WebSocket(getWebSocketUrl(token));

        socket.onopen = () => {
          reconnectAttempt = 0;
          setStatus('connected');
        };

        socket.onmessage = (message) => {
          let event: RealtimeEvent;
          try {
            event = JSON.parse(message.data) as RealtimeEvent;
          } catch {
            return;
          }

          if (event.type === 'simulation:update') {
            const cameraCounts = event.data?.cameraCounts as Record<string, number> | undefined;
            if (cameraCounts) {
              queryClient.setQueryData<Camera[]>(['cameras'], (cameras) => {
                if (!cameras) return cameras;
                return cameras.map((camera) => ({
                  ...camera,
                  liveVehicleCount: cameraCounts[camera.id] ?? 0,
                  lastUpdated: event.timestamp,
                }));
              });
            }
          }

          if (event.type === 'alert:changed') {
            queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
            queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
            queryClient.invalidateQueries({ queryKey: ['activeAlertCount'] });
            queryClient.invalidateQueries({ queryKey: ['trafficStats'] });
            queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
          }
        };

        socket.onclose = () => {
          setStatus('disconnected');
          if (disposed) return;
          const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000);
          reconnectAttempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        };

        socket.onerror = () => {
          // onclose performs the reconnect with backoff.
        };
      } catch {
        setStatus('disconnected');
        if (disposed) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close(1000, 'Dashboard unmounted');
    };
  }, [onStatusChange, queryClient]);
}
