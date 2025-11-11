import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Scan } from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<{ rawValue: string; format?: string } | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectorRef = useRef<any | null>(null);
  const rafRef = useRef<number | null>(null);
  const torchOnRef = useRef<boolean>(false);
  const scannerModeRef = useRef<'native' | 'zxing' | null>(null);

  // No auto-attachment: ZXing manages attaching the stream to the video element.
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    if (!window.isSecureContext) {
      setCameraError('Camera requires a secure context (HTTPS or localhost)');
      return;
    }
    try {
      // Stop previous session if any
      stopCamera();
      setCameraActive(true);
      setScanning(true);
      // Ensure the video element is mounted before binding the stream
      const waitForVideo = async () => {
        const maxWaitMs = 1500;
        const step = 50;
        let waited = 0;
        while (!videoRef.current && waited < maxWaitMs) {
          await new Promise((r) => setTimeout(r, step));
          waited += step;
        }
        if (!videoRef.current) throw new Error('Video element not ready');
        return videoRef.current;
      };

      const videoEl = await waitForVideo();
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 },
          advanced: [{ focusMode: 'continuous' as any }],
        },
      };

      // Prefer native BarcodeDetector when available
      const BD = (window as any).BarcodeDetector;
      let usingNative = false;
      if (typeof BD === 'function') {
        try {
          const supported: string[] = (await BD.getSupportedFormats?.()) || [];
          const desired = ['ean_13','ean_8','upc_a','code_128','qr_code'];
          const formats = supported.length ? desired.filter(f => supported.includes(f)) : desired;
          detectorRef.current = new BD({ formats });
          usingNative = true;
        } catch {
          usingNative = false;
        }
      }

      if (usingNative) {
        // Attach stream manually and run detection loop
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // @ts-expect-error assign stream
        videoEl.srcObject = stream;
        await videoEl.play();
        scannerModeRef.current = 'native';

        const detectLoop = async () => {
          if (!detectorRef.current || !videoRef.current || !scanning) return;
          try {
            let codes: any[] = [];
            try {
              codes = await detectorRef.current.detect(videoRef.current);
            } catch {
              // Fallback: use canvas snapshot if direct video detect fails
              const canvas = canvasRef.current;
              if (canvas) {
                const w = videoRef.current.videoWidth || 1280;
                const h = videoRef.current.videoHeight || 720;
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, w, h);
                  codes = await detectorRef.current.detect(canvas);
                }
              }
            }
            if (codes && codes.length) {
              const code = codes[0];
              const text = String(code.rawValue || code?.value || '');
              const fmt = String(code.format || '');
              if (text) {
                setDetected({ rawValue: text, format: fmt });
                toast({ title: 'Barcode detected', description: text });
                setScanning(false);
                stopCamera();
                try { navigate(`/barcode-result/${encodeURIComponent(text)}`); } catch {}
                return;
              }
            }
          } catch {}
          rafRef.current = requestAnimationFrame(detectLoop);
        };
        rafRef.current = requestAnimationFrame(detectLoop);
      } else {
        // Fallback to ZXing
        const reader = new BrowserMultiFormatReader();
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.UPC_A,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
        ]);
        // @ts-expect-error setHints exists on underlying reader
        reader.setHints?.(hints);
        readerRef.current = reader;
        const controls = await reader.decodeFromConstraints(constraints, videoEl, (result, err, ctrl) => {
          if (result) {
            const text = result.getText();
            const fmt = String(result.getBarcodeFormat?.() || '');
            setDetected({ rawValue: text, format: fmt });
            toast({ title: 'Barcode detected', description: text });
            setScanning(false);
            // Stop scanning to prevent duplicate detections
            controlsRef.current?.stop();
            controlsRef.current = null;
            setCameraActive(false);
            // Navigate to result page for downstream nutrition analysis
            try {
              const encoded = encodeURIComponent(text);
              navigate(`/barcode-result/${encoded}`);
            } catch {}
          }
          // Errors during decoding are expected while searching; ignore them.
        });
        controlsRef.current = controls;
      }
    } catch (err) {
      console.error('ZXing start error', err);
      setCameraError('Unable to start scanner');
      setScanning(false);
      setCameraActive(false);
      toast({ title: 'Scanner failed to start', description: 'Try another browser or grant camera permission.', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    setScanning(false);
    try {
      controlsRef.current?.stop();
      controlsRef.current = null;
    } catch {}
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    detectorRef.current = null;
    scannerModeRef.current = null;
    const video = videoRef.current;
    const src = (video?.srcObject as MediaStream | null) || null;
    if (src) src.getTracks().forEach((t) => t.stop());
    if (video) {
      video.pause();
      // @ts-expect-error clear srcObject
      video.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleTorch = async () => {
    try {
      const video = videoRef.current;
      const stream: MediaStream | null = (video?.srcObject as MediaStream | null) || null;
      const track = stream?.getVideoTracks?.()[0];
      const caps: any = track?.getCapabilities?.();
      if (track && caps && 'torch' in caps) {
        torchOnRef.current = !torchOnRef.current;
        await track.applyConstraints({ advanced: [{ torch: torchOnRef.current }] });
        toast({ title: torchOnRef.current ? 'Flash on' : 'Flash off' });
      }
    } catch {}
  };

  // Keep image upload handler for future use; currently not exposed in UI.
  const getBarcodeDetector = () => null;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        const rAny = reader as any;
        const decodeFn = rAny.decodeFromImageElement || rAny.decodeFromImage || rAny.decodeFromImageUrl;
        const res = await (decodeFn.call(reader, img));
        const text = res.getText ? res.getText() : String(res);
        const fmt = String(res.getBarcodeFormat?.() || '');
        setDetected({ rawValue: text, format: fmt });
        toast({ title: 'Barcode detected', description: text });
      } catch (err) {
        toast({ title: 'No barcode found', description: 'Try better lighting or focus.' });
      }
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-bold">Barcode Scanner</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Instructions / Actions */}
          {/* Controls */}
          <Card className="border-sky-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                    <Scan className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Scan food packaging</CardTitle>
                    <CardDescription>Point at any barcode to get instant nutrition info</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={startCamera} className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white">
                    <Camera className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="flex-1" disabled={!cameraActive}>
                    Stop
                  </Button>
                  <Button variant="outline" onClick={toggleTorch} className="flex-1" disabled={!cameraActive}>
                    Flash
                  </Button>
                </div>
                {cameraError && (
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                )}
              </CardContent>
            </Card>
          

          {/* Live camera view */}
          {cameraActive && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                  {/* Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-12 border-2 border-sky-400/70 rounded-xl" />
                    <div className="absolute top-4 left-4 text-xs bg-black/50 text-white px-2 py-1 rounded">{scanning ? 'Scanning…' : 'Starting…'}</div>
                  </div>
                </div>
                <div className="p-4 flex gap-3">
                  <Button variant="outline" onClick={stopCamera} className="flex-1">Stop</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {detected && (
            <Card>
              <CardHeader>
                <CardTitle>Barcode Detected</CardTitle>
                <CardDescription>Scan result from your camera or image</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Code</p>
                    <p className="font-mono text-lg">{detected.rawValue}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Format</p>
                    <p className="text-lg">{detected.format || 'Unknown'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => { setDetected(null); startCamera(); }} className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white">Scan</Button>
                  <Button variant="outline" onClick={() => { setDetected(null); stopCamera(); }} className="flex-1">Stop</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden elements */}
          {/* Hidden input retained for potential future use, but not exposed in UI */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
};

export default BarcodeScanner;