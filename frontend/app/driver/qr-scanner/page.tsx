'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Info
} from 'lucide-react';

export default function QRScannerPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastScannedPayload, setLastScannedPayload] = useState<string>('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; passenger?: any } | null>(null);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);

  // References for Html5Qrcode
  const html5QrCodeRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Sound Feedback Generator
  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        // High beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Low buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime); 
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (err) {
      console.warn('Web Audio playback failed:', err);
    }
  };

  // Haptic feedback
  const triggerVibration = (type: 'success' | 'error') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([300]);
      }
    }
  };

  // Fetch available cameras
  useEffect(() => {
    // Import html5-qrcode dynamically on client-side to prevent SSR errors
    import('html5-qrcode').then((module) => {
      module.Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera if possible
            const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
          } else {
            toast({
              variant: 'error',
              title: 'No cameras found',
              description: 'Please ensure camera permissions are enabled.'
            });
          }
        })
        .catch((err) => {
          console.error('Error listing cameras:', err);
        });
    });

    return () => {
      // Stop scanner on unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [toast]);

  // Handle QR scanning
  const startScanning = async () => {
    if (!selectedCameraId) {
      toast({
        variant: 'error',
        title: 'Camera select error',
        description: 'Please select a camera first.'
      });
      return;
    }

    setScanResult(null);
    setLoading(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // If there's an active scanner, stop it first
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const scanner = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        selectedCameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Avoid multiple parallel requests for the same code
          if (decodedText === lastScannedPayload) return;
          setLastScannedPayload(decodedText);
          await processBoardingPayload(decodedText);
        },
        (errorMessage) => {
          // Silent log to avoid flooding console with scan failures
        }
      );

      setScannerActive(true);
      setFlashlightOn(false);
    } catch (err: any) {
      console.error('Scanner start failed:', err);
      toast({
        variant: 'error',
        title: 'Scanner initialization error',
        description: err?.message || 'Could not start camera.'
      });
    } finally {
      setLoading(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      setLoading(true);
      try {
        await html5QrCodeRef.current.stop();
        setScannerActive(false);
        setFlashlightOn(false);
        setLastScannedPayload('');
      } catch (err: any) {
        console.error('Stop scanner failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Process the decrypted payload on backend
  const processBoardingPayload = async (payload: string) => {
    setLoading(true);
    try {
      const response = await api.post('/driver/scan', { qrPayload: payload });
      const booking = response.data.booking;
      
      playSound('success');
      triggerVibration('success');
      setScanResult({
        success: true,
        message: response.data.message || 'Passenger boarded successfully!',
        passenger: booking.user,
      });

      toast({
        variant: 'success',
        title: 'Boarding success',
        description: `${booking.user?.name || 'Student'} is checked in!`
      });
    } catch (error: any) {
      playSound('error');
      triggerVibration('error');
      
      const errMsg = error?.response?.data?.message || 'Invalid or expired QR code';
      setScanResult({
        success: false,
        message: errMsg,
      });

      toast({
        variant: 'error',
        title: 'Boarding denied',
        description: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle camera flashlight
  const toggleFlashlight = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        const nextState = !flashlightOn;
        const tracks = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (tracks.torch) {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: nextState } as any]
          });
          setFlashlightOn(nextState);
        } else {
          toast({
            variant: 'info',
            title: 'Flashlight unsupported',
            description: 'Flashlight feature is not supported on this device/camera.'
          });
        }
      } catch (err) {
        console.warn('Could not toggle flashlight:', err);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-xl space-y-6">
        
        {/* Upper Header bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">QR Passenger Scanner</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time camera scanner for UniRide drivers</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Camera Selector Panel */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800/80">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Select Camera</label>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                if (scannerActive) {
                  // Restart with new camera
                  setTimeout(() => startScanning(), 100);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {cameras.length === 0 ? (
                <option value="">No cameras detected</option>
              ) : (
                cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {!scannerActive ? (
              <Button 
                onClick={startScanning} 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Start Camera
              </Button>
            ) : (
              <Button 
                onClick={stopScanning} 
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Stop Camera
              </Button>
            )}

            {scannerActive && (
              <Button
                onClick={toggleFlashlight}
                variant="outline"
                className={`bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 ${flashlightOn ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' : ''}`}
                title="Toggle Flashlight"
              >
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Interactive Video Stream View Card */}
        <Card className="overflow-hidden border border-slate-800/80 bg-slate-950 rounded-2xl relative shadow-2xl">
          {/* Glassmorphic border glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <div className="p-6 flex flex-col items-center justify-center min-h-[340px]">
            {/* The html5-qrcode target container */}
            <div 
              id="qr-reader-container" 
              className={`w-full max-w-[340px] aspect-square rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed ${scannerActive ? 'border-blue-500' : 'border-slate-800'} transition-all`}
            />

            {!scannerActive && (
              <div className="absolute flex flex-col items-center justify-center text-center p-6 space-y-3 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 animate-pulse">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Camera is inactive</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Select a camera and tap "Start Camera" above to scan students' tickets.</p>
                </div>
              </div>
            )}

            {scannerActive && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-full border border-slate-800/30">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                Align passenger QR inside the target box
              </div>
            )}
          </div>
        </Card>

        {/* Scan Status Display */}
        {scanResult && (
          <Card className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
            scanResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex gap-4">
              <div className="mt-0.5">
                {scanResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-rose-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-white text-lg">
                  {scanResult.success ? 'Boarding Allowed' : 'Access Denied'}
                </h4>
                <p className="text-sm opacity-90">{scanResult.message}</p>
                
                {scanResult.success && scanResult.passenger && (
                  <div className="mt-4 bg-slate-950/60 p-3 rounded-lg border border-emerald-500/20 text-slate-300 space-y-1">
                    <div className="text-xs text-slate-400">Student Info</div>
                    <div className="font-semibold text-white">{scanResult.passenger.name}</div>
                    <div className="text-sm">ID: {scanResult.passenger.universityId}</div>
                    <div className="text-sm opacity-85">{scanResult.passenger.email}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Technical Info Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex gap-3 text-xs text-slate-400">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            Boarding QR codes are cryptographically secured using AES-256-GCM. 
            The codes are rotated and expire to prevent unauthorized travel sharing.
          </p>
        </div>

      </div>
    </main>
  );
}
