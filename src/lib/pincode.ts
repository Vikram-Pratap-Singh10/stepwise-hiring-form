export type PinLookup = { pin: string; status: "ok" | "not_found" | "error"; areas: string[] };

export const PIN_RE = /^\d{6}$/;

type PostOffice = { Name?: string | null; District?: string | null; State?: string | null };
export type PostResponse = { Message?: string; Status?: string; PostOffice?: PostOffice[] | null }[];

export function parsePinResponse(pin: string, json: PostResponse): PinLookup {
  const offices = json?.[0]?.PostOffice;
  if (!offices || offices.length === 0) return { pin, status: "not_found", areas: [] };
  const areas = [...new Set(offices.map((o) => [o.Name, o.District, o.State].filter(Boolean).join(", ")).filter(Boolean))];
  if (areas.length === 0) return { pin, status: "not_found", areas: [] };
  return { pin, status: "ok", areas };
}
