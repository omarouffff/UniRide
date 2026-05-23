'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/lib/apiConfig';
import { getSupabaseAccessToken } from '@/lib/supabaseClient';

const MAX_RECONNECT_ATTEMPTS = 8;

export function useSocket(enabled = true) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let active = true;
    let socket: Socket | null = null;

    const connect = async () => {
      try {
        const token = await getSupabaseAccessToken();
        if (!token || !active) return;

        const url = getSocketUrl();
        if (!url) {
          setError('Socket URL is not configured');
          return;
        }

        socket = io(url, {
          auth: { token },
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 8000,
        });

        socket.on('connect', () => {
          if (!active) return;
          setConnected(true);
          setError(null);
        });

        socket.on('disconnect', () => active && setConnected(false));

        socket.on('connect_error', (err) => {
          if (!active) return;
          setError(err.message || 'Socket connection failed');
          setConnected(false);
        });

        socket.io.on('reconnect_attempt', () => {
          if (!active) return;
          setError(null);
        });

        socket.io.on('reconnect_failed', () => {
          if (!active) return;
          setError('Unable to connect to realtime server');
        });

        socketRef.current = socket;
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Socket setup failed');
        }
      }
    };

    connect();

    return () => {
      active = false;
      disconnect();
    };
  }, [enabled, disconnect]);

  return { socket: socketRef, connected, error };
}
