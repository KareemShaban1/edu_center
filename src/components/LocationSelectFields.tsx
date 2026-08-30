import { useQuery } from '@tanstack/react-query';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import LocationMapPicker from '@/components/LocationMapPicker';
import { useLocale } from '@/contexts/LocaleContext';
import { adminSettingsApi } from '@/services/endpoints/admin-settings';

export interface LocationFormValues {
  governorate_id: string;
  city_id: string;
  area_id: string;
  lat: string;
  long: string;
}

interface LocationSelectFieldsProps {
  form: LocationFormValues;
  onChange: (patch: Partial<LocationFormValues>) => void;
  showMap?: boolean;
}

export default function LocationSelectFields({ form, onChange, showMap = true }: LocationSelectFieldsProps) {
  const { t } = useLocale();
  const { data: governorates = [] } = useQuery({
    queryKey: ['admin-governorates'],
    queryFn: () => adminSettingsApi.listGovernorates(),
  });
  const { data: cities = [] } = useQuery({
    queryKey: ['admin-cities', form.governorate_id],
    queryFn: () => adminSettingsApi.listCities(form.governorate_id ? { governorate_id: Number(form.governorate_id) } : undefined),
    enabled: !!form.governorate_id,
  });
  const { data: areas = [] } = useQuery({
    queryKey: ['admin-areas', form.city_id],
    queryFn: () => adminSettingsApi.listAreas(form.city_id ? { city_id: Number(form.city_id) } : undefined),
    enabled: !!form.city_id,
  });

  const handleAreaChange = (areaId: string) => {
    const selected = areas.find(a => String(a.id) === areaId);
    onChange({
      area_id: areaId,
      lat: selected?.lat != null ? String(selected.lat) : form.lat,
      long: selected?.long != null ? String(selected.long) : form.long,
    });
  };

  return (
    <>
      <FormField label={t('col.governorate')} id="location-governorate">
        <FormSelect
          id="location-governorate"
          title={t('col.governorate')}
          value={form.governorate_id}
          onChange={e => onChange({ governorate_id: e.target.value, city_id: '', area_id: '' })}
        >
          <option value="">{t('form.select')}</option>
          {governorates.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.city')} id="location-city">
        <FormSelect
          id="location-city"
          title={t('col.city')}
          value={form.city_id}
          onChange={e => onChange({ city_id: e.target.value, area_id: '' })}
          disabled={!form.governorate_id}
        >
          <option value="">{t('form.select')}</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.area')} id="location-area">
        <FormSelect
          id="location-area"
          title={t('col.area')}
          value={form.area_id}
          onChange={e => handleAreaChange(e.target.value)}
          disabled={!form.city_id}
        >
          <option value="">{t('form.select')}</option>
          {areas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </FormSelect>
      </FormField>
      {showMap ? (
        <LocationMapPicker
          lat={form.lat}
          long={form.long}
          onChange={(nextLat, nextLong) => onChange({ lat: nextLat, long: nextLong })}
          className="pt-1"
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('col.lat')} id="location-lat">
          <FormInput
            id="location-lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={e => onChange({ lat: e.target.value })}
          />
        </FormField>
        <FormField label={t('col.long')} id="location-long">
          <FormInput
            id="location-long"
            type="number"
            step="any"
            value={form.long}
            onChange={e => onChange({ long: e.target.value })}
          />
        </FormField>
      </div>
    </>
  );
}

export function locationValuesFromSettings(settings: {
  governorate_id?: number | null;
  city_id?: number | null;
  area_id?: number | null;
  lat?: number | null;
  long?: number | null;
}): LocationFormValues {
  return {
    governorate_id: settings.governorate_id ? String(settings.governorate_id) : '',
    city_id: settings.city_id ? String(settings.city_id) : '',
    area_id: settings.area_id ? String(settings.area_id) : '',
    lat: settings.lat != null ? String(settings.lat) : '',
    long: settings.long != null ? String(settings.long) : '',
  };
}

export function locationPayloadFromValues(values: LocationFormValues) {
  return {
    governorate_id: values.governorate_id ? Number(values.governorate_id) : null,
    city_id: values.city_id ? Number(values.city_id) : null,
    area_id: values.area_id ? Number(values.area_id) : null,
    lat: values.lat.trim() ? Number(values.lat) : null,
    long: values.long.trim() ? Number(values.long) : null,
  };
}
