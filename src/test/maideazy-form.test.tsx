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
  pin: "400001",
  jobRoles: ["Cooking Assistant"],
  otherRole: "",
  jobLocations: [{ pin: "110001", area: "Connaught Place, New Delhi, Delhi" }],
  workType: ["Full-time"],
  salary: "15000",
};

describe("MAIDEAZY form rules", () => {
  it("accepts a valid form with a single address PIN and multiple job locations", () => {
    expect(
      maideazySchema.safeParse({
        ...base,
        jobLocations: [
          { pin: "110001", area: "Connaught Place, New Delhi, Delhi" },
          { pin: "560001", area: "Bengaluru, Karnataka" },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires one 6-digit PIN code for the permanent address", () => {
    expect(maideazySchema.safeParse({ ...base, pin: "" }).success).toBe(false);
    expect(maideazySchema.safeParse({ ...base, pin: "40001" }).success).toBe(false);
    expect(maideazySchema.safeParse({ ...base, pin: "4000012" }).success).toBe(false);
  });

  it("requires at least one preferred job location", () => {
    expect(maideazySchema.safeParse({ ...base, jobLocations: [] }).success).toBe(false);
  });

  it("requires an area for every preferred job location", () => {
    expect(maideazySchema.safeParse({ ...base, jobLocations: [{ pin: "110001", area: "" }] }).success).toBe(false);
  });

  it("rejects preferred job location PIN codes that are not 6 digits", () => {
    expect(maideazySchema.safeParse({ ...base, jobLocations: [{ pin: "11001", area: "Delhi" }] }).success).toBe(false);
  });

  it("requires other-role detail only when Other is selected", () => {
    expect(maideazySchema.safeParse({ ...base, jobRoles: ["Other"], otherRole: "" }).success).toBe(false);
    expect(maideazySchema.safeParse({ ...base, jobRoles: ["Other"], otherRole: "Driver" }).success).toBe(true);
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
