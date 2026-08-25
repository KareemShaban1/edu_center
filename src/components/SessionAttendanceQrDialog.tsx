import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, QrCode, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField, FormInput } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import {
  attendanceQrApi,
  type AttendanceQrToken,
  type AttendanceQrVenue,
} from '@/services/endpoints/attendance-qr';

function errMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Request failed';
}

async function readDeviceLocation(): Promise<{ latitude: number; longitude: number; accuracy: number | null }> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device.');
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
      err => reject(new Error(err.message || 'Unable to read GPS location.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function SessionAttendanceQrDialog({
  sessionId,
  topic,
  role,
  onClose,
}: {
  sessionId: number;
  topic: string;
  role: 'admin' | 'teacher';
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [token, setToken] = useState<AttendanceQrToken | null>(null);
  const [venue, setVenue] = useState<AttendanceQrVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingVenue, setSettingVenue] = useState(false);
  const [radius, setRadius] = useState(150);

  const fetchToken = useCallback(async () => {
    try {
      const next = role === 'admin'
        ? await attendanceQrApi.getAdminToken(sessionId)
        : await attendanceQrApi.getTeacherToken(sessionId);
      setToken(next);
      setVenue(next.venue);
      if (next.venue.geofence_radius_m) setRadius(next.venue.geofence_radius_m);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      toast({ title: t('attendanceQr.loadFailed'), description: errMessage(error), variant: 'destructive' });
    }
  }, [role, sessionId, t]);

  useEffect(() => {
    void fetchToken();
    const id = window.setInterval(() => {
      void fetchToken();
    }, 8000);
    return () => window.clearInterval(id);
  }, [fetchToken]);

  const setVenueFromDevice = async () => {
    setSettingVenue(true);
    try {
      const loc = await readDeviceLocation();
      const result = role === 'admin'
        ? await attendanceQrApi.setAdminVenue(sessionId, {
            latitude: loc.latitude,
            longitude: loc.longitude,
            geofence_radius_m: radius,
          })
        : await attendanceQrApi.setTeacherVenue(sessionId, {
            latitude: loc.latitude,
            longitude: loc.longitude,
            geofence_radius_m: radius,
          });
      setVenue(result.venue);
      toast({ title: t('attendanceQr.venueSaved'), description: t('attendanceQr.venueSavedDesc') });
      await fetchToken();
    } catch (error: unknown) {
      toast({ title: t('attendanceQr.venueFailed'), description: errMessage(error), variant: 'destructive' });
    } finally {
      setSettingVenue(false);
    }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('attendanceQr.title')} — {topic}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{t('attendanceQr.hint')}</p>

        <div className="flex flex-col items-center gap-3 rounded-xl border bg-background p-4">
          {loading || !token?.payload ? (
            <div className="flex h-56 w-56 items-center justify-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : (
            <QRCodeSVG value={token.payload} size={224} includeMargin level="M" />
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            {t('attendanceQr.rotates').replace('{seconds}', String(token?.window_seconds ?? 30))}
            {token ? ` · ${token.expires_in}s` : null}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {venue?.configured ? t('attendanceQr.venueReady') : t('attendanceQr.venueRequired')}
              </p>
              <p className="text-xs text-muted-foreground">
                {venue?.configured
                  ? `${venue.latitude?.toFixed(5)}, ${venue.longitude?.toFixed(5)} · ${venue.geofence_radius_m ?? radius}m`
                  : t('attendanceQr.venueRequiredDesc')}
              </p>
            </div>
          </div>

          <FormField label={t('attendanceQr.radius')} id="qr-radius">
            <FormInput
              id="qr-radius"
              type="number"
              min={30}
              max={1000}
              value={radius}
              onChange={e => setRadius(Number(e.target.value) || 150)}
            />
          </FormField>

          <Button
            type="button"
            className="w-full gap-2"
            disabled={settingVenue}
            onClick={() => void setVenueFromDevice()}
          >
            <MapPin className="h-4 w-4" />
            {settingVenue ? t('common.loading') : t('attendanceQr.useMyLocation')}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
