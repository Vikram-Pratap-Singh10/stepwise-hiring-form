import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parsePinResponse, type PinLookup } from "./pincode";

export const lookupPin = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ pin: z.string().regex(/^\d{6}$/) }).parse(data))
  .handler(async ({ data }): Promise<PinLookup> => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${data.pin}`);
      if (!res.ok) return { pin: data.pin, status: "error", areas: [] };
      const json = (await res.json()) as Parameters<typeof parsePinResponse>[1];
      return parsePinResponse(data.pin, json);
    } catch {
      return { pin: data.pin, status: "error", areas: [] };
    }
  });
