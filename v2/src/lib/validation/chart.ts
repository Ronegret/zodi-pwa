import { z } from 'zod';
import { emptyToUndefined } from './common';
import {
  birthDateSchema,
  birthTimeSchema,
  latitudeSchema,
  longitudeSchema,
  timeZoneSchema,
} from './profile';

/** POST /api/carta. `time` nulo = hora desconocida. */
export const chartRequestSchema = z.strictObject({
  date: birthDateSchema,
  time: z
    .preprocess(emptyToUndefined, birthTimeSchema.nullable().optional())
    .transform((t) => t ?? null),
  timeZone: timeZoneSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  houseSystem: z.enum(['placidus', 'whole-sign']).optional(),
});

export type ChartRequest = z.infer<typeof chartRequestSchema>;
