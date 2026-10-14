import * as Astronomy from 'astronomy-engine';
import { norm360 } from './math';
import type { PlanetId } from './types';

const BODY: Record<Exclude<PlanetId, 'northNode'>, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

/** Longitud eclíptica geocéntrica aparente, tropical, de la fecha. */
export function longitudeOf(id: PlanetId, date: Date): number {
  if (id === 'northNode') {
    // Nodo lunar medio (Meeus, cap. 47).
    const t = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
    return norm360(125.0445479 - 1934.1362891 * t + 0.0020754 * t * t);
  }
  if (id === 'sun') return Astronomy.SunPosition(date).elon;
  const time = Astronomy.MakeTime(date);
  const v = id === 'moon' ? Astronomy.GeoMoon(time) : Astronomy.GeoVector(BODY[id], time, true);
  const ecl = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), v);
  return norm360(Astronomy.SphereFromVector(ecl).lon);
}

export function isRetrograde(id: PlanetId, date: Date): boolean {
  if (id === 'sun' || id === 'moon') return false;
  if (id === 'northNode') return true; // el nodo medio es siempre retrógrado
  const h = 6 * 3600_000;
  const a = longitudeOf(id, new Date(date.getTime() - h));
  const b = longitudeOf(id, new Date(date.getTime() + h));
  return ((b - a + 540) % 360) - 180 < 0;
}
