import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

function parseCoord(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatCoord(value: number): string {
  return value.toFixed(6);
}

interface LocationMapPickerProps {
  lat: string;
  long: string;
  onChange: (lat: string, long: string) => void;
  className?: string;
}

export default function LocationMapPicker({ lat, long, onChange, className }: LocationMapPickerProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const skipSyncRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const coords = useMemo(() => {
    const parsedLat = parseCoord(lat);
    const parsedLong = parseCoord(long);
    if (parsedLat != null && parsedLong != null) {
      return { lat: parsedLat, lng: parsedLong };
    }
    return null;
  }, [lat, long]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const parsedLat = parseCoord(lat);
    const parsedLong = parseCoord(long);
    const initial = parsedLat != null && parsedLong != null
      ? { lat: parsedLat, lng: parsedLong }
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: parsedLat != null && parsedLong != null ? 15 : 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initial.lat, initial.lng], {
      draggable: true,
      icon: defaultIcon,
    }).addTo(map);

    const emitCoords = (nextLat: number, nextLong: number) => {
      skipSyncRef.current = true;
      onChangeRef.current(formatCoord(nextLat), formatCoord(nextLong));
    };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      emitCoords(pos.lat, pos.lng);
    });

    map.on('click', event => {
      marker.setLatLng(event.latlng);
      emitCoords(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !coords) return;

    marker.setLatLng([coords.lat, coords.lng]);
    map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), 14));
  }, [coords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      position => {
        const map = mapRef.current;
        const marker = markerRef.current;
        const nextLat = position.coords.latitude;
        const nextLong = position.coords.longitude;
        if (map && marker) {
          marker.setLatLng([nextLat, nextLong]);
          map.setView([nextLat, nextLong], 16);
        }
        skipSyncRef.current = true;
        onChangeRef.current(formatCoord(nextLat), formatCoord(nextLong));
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t('settings.mapHint')}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation}>
          <Crosshair className="h-4 w-4 me-1.5" aria-hidden />
          {t('settings.useMyLocation')}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-xl border border-border bg-muted/20 sm:h-80"
        aria-label={t('settings.mapPicker')}
      />
    </div>
  );
}
