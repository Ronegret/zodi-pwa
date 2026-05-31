"use client";

import { calculateSunSign, calculateLifePathNumber } from "@/lib/astral";

export type CircleRelation =
  | "pareja" | "ex" | "amigo/a" | "papá" | "mamá"
  | "hijo/a" | "hermano/a" | "familiar" | "compañero/a" | "crush" | "otro";

export type CirclePerson = {
  id: string;
  name: string;
  relation: CircleRelation;
  birthDate?: string;
  birthCountry?: string;
  birthCity?: string;
  notes?: string;
  zodiacSign?: string;
  lifePathNumber?: number;
  addedAt: number;
};

const CIRCLE_KEY = "zodi.circle";

export function getCircle(): CirclePerson[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CIRCLE_KEY) || "[]"); }
  catch { return []; }
}

export function addToCircle(
  person: Pick<CirclePerson, "name" | "relation" | "birthDate" | "birthCountry" | "birthCity" | "notes">
): CirclePerson {
  const circle = getCircle();
  const newPerson: CirclePerson = {
    ...person,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    addedAt: Date.now(),
    zodiacSign:      person.birthDate ? calculateSunSign(person.birthDate) : undefined,
    lifePathNumber:  person.birthDate ? calculateLifePathNumber(person.birthDate) : undefined,
  };
  localStorage.setItem(CIRCLE_KEY, JSON.stringify([newPerson, ...circle].slice(0, 50)));
  return newPerson;
}

export function updateCirclePerson(id: string, updates: Partial<CirclePerson>): void {
  const updated = getCircle().map(p =>
    p.id !== id ? p : {
      ...p, ...updates,
      zodiacSign:     updates.birthDate ? calculateSunSign(updates.birthDate) : p.zodiacSign,
      lifePathNumber: updates.birthDate ? calculateLifePathNumber(updates.birthDate) : p.lifePathNumber,
    }
  );
  localStorage.setItem(CIRCLE_KEY, JSON.stringify(updated));
}

export function removeFromCircle(id: string): void {
  localStorage.setItem(CIRCLE_KEY, JSON.stringify(getCircle().filter(p => p.id !== id)));
}
