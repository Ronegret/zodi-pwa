import { computeNatalChart, ENGINE_VERSION, type NatalChart } from '@/lib/astro-engine';
import type { Json, Tables } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { ChartRequest } from '@/lib/validation/chart';

/** Sin hora conocida se calcula a mediodía local: planetas fiables, casas y ASC no. */
export const UNKNOWN_TIME_FALLBACK = '12:00';

export interface ChartInput extends ChartRequest {
  timeKnown: boolean;
}

export interface StoredChart {
  id: string;
  input: ChartInput;
  chart: NatalChart;
  engineVersion: string;
  createdAt: string;
}

const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;

export function buildChartRecord(request: ChartRequest) {
  const input: ChartInput = { ...request, timeKnown: request.time !== null };
  const chart = computeNatalChart({
    date: request.date,
    time: request.time ?? UNKNOWN_TIME_FALLBACK,
    timeZone: request.timeZone,
    latitude: request.latitude,
    longitude: request.longitude,
    ...(request.houseSystem ? { houseSystem: request.houseSystem } : {}),
  });
  return { input, chart, engine_version: ENGINE_VERSION };
}

const COLUMNS = 'id, input, chart, engine_version, created_at';
type ChartRow = Pick<
  Tables<'natal_charts'>,
  'id' | 'input' | 'chart' | 'engine_version' | 'created_at'
>;

function fromRow(row: ChartRow): StoredChart {
  return {
    id: row.id,
    input: row.input as unknown as ChartInput,
    chart: row.chart as unknown as NatalChart,
    engineVersion: row.engine_version,
    createdAt: row.created_at,
  };
}

/** Calcula y guarda la carta propia con la sesión del usuario (RLS). */
export async function saveSelfChart(
  supabase: ZodiSupabaseClient,
  request: ChartRequest,
): Promise<StoredChart> {
  const record = buildChartRecord(request);
  const { data, error } = await supabase
    .from('natal_charts')
    .insert({
      label: 'Yo',
      is_self: true,
      input: toJson(record.input),
      chart: toJson(record.chart),
      engine_version: record.engine_version,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(`saveSelfChart: ${error.message}`);
  return fromRow(data);
}

export async function getLatestSelfChart(
  supabase: ZodiSupabaseClient,
): Promise<StoredChart | null> {
  const { data, error } = await supabase
    .from('natal_charts')
    .select(COLUMNS)
    .eq('is_self', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestSelfChart: ${error.message}`);
  return data ? fromRow(data) : null;
}
