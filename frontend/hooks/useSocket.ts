'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { getSupabaseAccessToken } from '@/lib/supabaseClient';

export function useSocket(enabled = true) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let active = true;

    const connect = async () => {
      const token = await getSupabaseAccessToken();
      if (!token || !active) return;

      const socket = io(getApiBaseUrl().replace(/\/api$/, ''), {
        auth: { token },
        transports: ['websocket'],
        withCredentials: true,
      });

      socket.on('connect', () => active && setConnected(true));
      socket.on('disconnect', () => active && setConnected(false));
      socketRef.current = socket;
    };

    connect();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return { socket: socketRef, connected };
}
