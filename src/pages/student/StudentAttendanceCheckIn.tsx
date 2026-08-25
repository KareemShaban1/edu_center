import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, MapPin, QrCode, ScanLine } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  attendanceStatusLabel,
  translateAttendanceError,
  translateAttendanceErrorFromUnknown,
} from '@/lib/translate-attendance-error';
import {
  attendanceQrApi,
  type AttendanceCheckInResult,
} from '@/services/endpoints/attendance-qr';

async function readDeviceLocation(t: (key: string) => string): Promise<{ latitude: number; longitude: number; accuracy: number | null }> {
  if (!navigator.geolocation) {
    throw new Error(t('attendanceQr.error.geoUnsupported'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
        });
      },
      err => reject(new Error(translateAttendanceError(err.message || t('attendanceQr.error.gpsUnreadable'), t))),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

export default function StudentAttendanceCheckIn() {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttendanceCheckInResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const readerId = 'student-attendance-qr-reader';
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore stop errors
    }
  }, []);

  const handlePayload = useCallback(async (rawPayload: string) => {
    if (handlingRef.current || submitting) return;
    handlingRef.current = true;
    setSubmitting(true);
    try {
      await stopScanner();
      setScanning(false);
      let centerId: number | null = null;
      try {
        const parsed = JSON.parse(rawPayload) as { c?: number };
        if (typeof parsed.c === 'number' && parsed.c > 0) centerId = parsed.c;
      } catch {
        // payload may still be valid server-side
      }
      const loc = await readDeviceLocation(t);
      const checkIn = await attendanceQrApi.studentCheckIn({
        payload: rawPayload,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy_m: loc.accuracy,
        center_id: centerId,
      });
      setResult(checkIn);
      await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] });
      toast({
        title: t('attendanceQr.checkInSuccess'),
        description: t('attendanceQr.checkInSuccessDesc').replace(
          '{status}',
          attendanceStatusLabel(t, checkIn.status),
        ),
      });
    } catch (error: unknown) {
      const description = translateAttendanceErrorFromUnknown(error, t);
      toast({ title: t('attendanceQr.checkInFailed'), description, variant: 'destructive' });
      handlingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [queryClient, stopScanner, submitting, t]);

  const startScanner = async () => {
    setResult(null);
    setCameraError(null);
    handlingRef.current = false;
    setScanning(true);
    try {
      await stopScanner();
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        decoded => {
          void handlePayload(decoded);
        },
        () => undefined,
      );
    } catch (error: unknown) {
      setScanning(false);
      const description = translateAttendanceErrorFromUnknown(error, t);
      setCameraError(description);
      toast({ title: t('attendanceQr.cameraFailed'), description, variant: 'destructive' });
    }
  };

  useEffect(() => () => {
    void stopScanner();
  }, [stopScanner]);

  const formattedCheckInTime = result?.checked_in_at
    ? new Date(result.checked_in_at).toLocaleString(dateLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <div className="page-header">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('attendanceQr.studentTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('attendanceQr.studentDesc')}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <ScanLine className="mt-0.5 h-4 w-4 shrink-0" />
            {t('attendanceQr.studentHint')}
          </p>
          <p className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {t('attendanceQr.studentGpsHint')}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-black/90">
          <div id={readerId} className="min-h-[260px] w-full" />
          {!scanning && !result && (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-4 py-10 text-center text-white">
              <QrCode className="h-10 w-10 opacity-80" />
              <p className="text-sm opacity-90">{t('attendanceQr.readyToScan')}</p>
            </div>
          )}
        </div>

        {cameraError && (
          <p className="text-sm text-destructive">{cameraError}</p>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {t('attendanceQr.markedAs').replace('{status}', attendanceStatusLabel(t, result.status))}
            </p>
            <p className="mt-1 text-muted-foreground">
              {formattedCheckInTime}
              {result.distance_m != null
                ? ` · ${t('attendanceQr.distanceMeters').replace('{distance}', String(Math.round(result.distance_m)))}`
                : ''}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!scanning ? (
            <Button type="button" className="gap-2" disabled={submitting} onClick={() => void startScanner()}>
              <ScanLine className="h-4 w-4" />
              {submitting ? t('common.loading') : t('attendanceQr.startScan')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                void stopScanner().then(() => setScanning(false));
              }}
            >
              {t('attendanceQr.stopScan')}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
