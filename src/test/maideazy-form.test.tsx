import { describe, expect, it } from "vitest";
import { parsePinResponse } from "@/lib/pincode";
import { schema as maideazySchema } from "@/components/MaideazyForm";

const postJson = [
  {
    Message: "Number of pincode(s) found:2",
    Status: "Success",
    PostOffice: [
      { Name: "Bazargate", District: "Mumbai", State: "Maharashtra" },
      { Name: "Bazargate", District: "Mumbai", State: "Maharashtra" },
      { Name: "Elephanta Caves Po", District: "Raigarh(MH)", State: "Maharashtra" },
    ],
  },
];

const base = {
  salesCode: "REF-01",
  fullName: "Test Kumar",
  mobile: "9876543210",
  dob: "1995-04-01",
  gender: "Female",
  address: "Flat 402, Sea Breeze Towers",
  city: "Mumbai",
  pincodes: ["400001"],
  jobRoles: ["Cooking Assistant"],
  otherRole: "",
  workType: ["Full-time"],
  salary: "15000",
};

describe("MAIDEAZY form rules", () => {
  it("accepts a valid form with multiple PIN codes", () => {
    expect(maideazySchema.safeParse({ ...base, pincodes: ["400001", "110001"] }).success).toBe(true);
  });

  it("requires at least one PIN code", () => {
    expect(maideazySchema.safeParse({ ...base, pincodes: [] }).success).toBe(false);
  });

  it("rejects PIN codes that are not 6 digits", () => {
    expect(maideazySchema.safeParse({ ...base, pincodes: ["40001"] }).success).toBe(false);
  });

  it("requires other-role detail only when Other is selected", () => {
    expect(maideazySchema.safeParse({ ...base, jobRoles: ["Other"], otherRole: "" }).success).toBe(false);
    expect(maideazySchema.safeParse({ ...base, jobRoles: ["Other"], otherRole: "Driver" }).success).toBe(true);
  });

  it("validates without signature, date or preferred job location fields", () => {
    expect(maideazySchema.safeParse(base).success).toBe(true);
    expect(JSON.stringify(maideazySchema.safeParse(base))).not.toContain("preferredLocation");
  });
});

describe("pincode area lookup parsing", () => {
  it("extracts unique areas with district and state", () => {
    const r = parsePinResponse("400001", postJson);
    expect(r.status).toBe("ok");
    expect(r.areas).toEqual([
      "Bazargate, Mumbai, Maharashtra",
      "Elephanta Caves Po, Raigarh(MH), Maharashtra",
    ]);
  });

  it("reports not_found when no post offices exist", () => {
    expect(parsePinResponse("999999", [{ Status: "Error" }])).toEqual({ pin: "999999", status: "not_found", areas: [] });
  });
});
