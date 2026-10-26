import { useState, type ReactNode } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Plus, X } from "lucide-react";
import { lookupPin } from "@/lib/pincode.functions";
import { PIN_RE } from "@/lib/pincode";

const JOB_ROLES = ["Maid / Housekeeping", "Cooking Assistant", "Nanny / Baby Care", "Elderly Care Assistant", "Multi-skilled Home Assistant", "Other"] as const;
const WORK_TYPES = ["Full-time", "Part-time", "Live-in", "Live-out"] as const;
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const req = (m: string) => z.string().trim().min(1, m).max(200);
const today = new Date().toISOString().slice(0, 10);

export const schema = z.object({
  salesCode: z.string().trim().max(50),
  fullName: req("Full name is required"),
  mobile: phone,
  dob: req("Date of birth is required"),
  gender: req("Select gender"),
  address: z.string().trim().min(5, "Address is required").max(500),
  city: req("City is required"),
  pincodes: z.array(z.string().regex(PIN_RE, "Enter a 6-digit PIN code")).min(1, "Add at least one PIN code"),
  jobRoles: z.array(z.string()).min(1, "Select at least one job role"),
  otherRole: z.string().trim().max(100),
  workType: z.array(z.string()).min(1, "Select at least one work type"),
  salary: z.string().trim().max(20),
}).refine((d) => !d.jobRoles.includes("Other") || d.otherRole.length > 0, { path: ["otherRole"], message: "Please specify the role" });

const initial = {
  salesCode: "", fullName: "", mobile: "", dob: "", gender: "", address: "", city: "",
  pincodes: [] as string[], jobRoles: [] as string[], otherRole: "", workType: [] as string[], salary: "",
};
type Data = typeof initial;
type K = keyof Data;

type PinAreaState = { loading: boolean; areas: string[]; error?: string };

function Field({ label, error, children, optional, full }: { label: string; error?: string | undefined; children: ReactNode; optional?: boolean; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-bold text-foreground">
        {label} {optional ? <span className="font-normal text-muted-foreground">(if any)</span> : <span className="text-destructive"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function MaideazyForm() {
  const [data, setData] = useState<Data>(initial);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinAreas, setPinAreas] = useState<Record<string, PinAreaState>>({});
  const lookupPinFn = useServerFn(lookupPin);

  const set = <T extends K>(k: T, v: Data[T]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const text = (k: K, type = "text", placeholder = "") => (
    <input className="field" type={type} placeholder={placeholder} value={data[k] as string} max={type === "date" && k === "dob" ? today : undefined} onChange={(e) => set(k, e.target.value as never)} />
  );
  const toggle = (k: "jobRoles" | "workType", v: string) => {
    const arr = data[k];
    set(k, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const runLookup = (pin: string) => {
    setPinAreas((m) => {
      if (m[pin]) return m;
      void lookupPinFn({ data: { pin } }).then((r) =>
        setPinAreas((cur) => ({
          ...cur,
          [pin]: { loading: false, areas: r.areas, error: r.status === "ok" ? undefined : r.status === "not_found" ? "Area not found for this PIN code" : "Area lookup failed, try again" },
        })),
      );
      return { ...m, [pin]: { loading: true, areas: [] } };
    });
  };
  const addPin = () => {
    const v = pinInput.trim();
    if (!PIN_RE.test(v)) { setPinError("Enter a 6-digit PIN code"); return; }
    if (!data.pincodes.includes(v)) {
      set("pincodes", [...data.pincodes, v]);
      runLookup(v);
    }
    setPinInput("");
  };
  const removePin = (p: string) => set("pincodes", data.pincodes.filter((x) => x !== p));

  const areaText = (a: PinAreaState | undefined) => {
    if (!a) return "";
    if (a.loading) return "Looking up area…";
    if (a.error) return a.error;
    if (a.areas.length <= 3) return a.areas.join(" • ");
    return `${a.areas.slice(0, 3).join(" • ")} +${a.areas.length - 3} more`;
  };

  const summaryText = () => {
    const role = data.jobRoles.map((r) => (r === "Other" ? `Other: ${data.otherRole}` : r)).join(", ");
    return [
      "MAIDEAZY — Job Seeker Registration",
      `Reference Code: ${data.salesCode || "-"}`,
      `Full Name: ${data.fullName}`,
      `Mobile Number: ${data.mobile}`,
      `Date of Birth: ${data.dob}`,
      `Gender: ${data.gender}`,
      `Full Residential Address: ${data.address}`,
      `City: ${data.city}`,
      `PIN Code(s): ${data.pincodes.join(", ")}`,
      `Job Role: ${role}`,
      `Work Type: ${data.workType.join(", ")}`,
      `Expected Salary (₹): ${data.salary || "-"}`,
    ].join("\n");
  };
  const copyForm = async () => {
    try {
      await navigator.clipboard.writeText(summaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submit = () => {
    const r = schema.safeParse(data);
    if (!r.success) {
      const e: Partial<Record<K, string>> = {};
      r.error.issues.forEach((i) => { const k = i.path[0] as K; if (!e[k]) e[k] = i.message; });
      setErrors(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setDone("ME-" + Date.now().toString().slice(-8));
    console.log("Submitted MAIDEAZY registration", data);
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-card p-10 text-center shadow-card">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-me-gold text-foreground"><Check className="size-8" /></div>
        <h2 className="mt-5 font-display text-2xl font-extrabold">Registration submitted</h2>
        <p className="mt-2 text-muted-foreground">Thank you, {data.fullName}. The MAIDEAZY team will contact you soon.</p>
        <p className="mt-4 inline-block rounded-md bg-secondary px-4 py-2 font-mono text-secondary-foreground">Registration ID: {done}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button type="button" onClick={copyForm} className="inline-flex items-center gap-2 rounded-lg bg-me-gold px-5 py-2.5 text-sm font-bold text-foreground hover:opacity-90">
            <Copy className="size-4" /> {copied ? "Copied!" : "Copy Completed Form"}
          </button>
          <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => { setData(initial); setDone(null); setCopied(false); setPinInput(""); setPinAreas({}); }}>Register another candidate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="p-6 text-center sm:p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide text-me-gold-deep">MAIDEAZY</h1>
        <p className="mt-1 font-display text-lg font-bold uppercase tracking-wide">Job Seeker Registration Form</p>
        <p className="mt-1 text-sm text-muted-foreground">Step 1: Personal Details</p>
        <div className="mx-auto mt-4 h-0.5 w-full bg-me-gold" />
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field label="Reference Code" optional error={errors.salesCode} full>{text("salesCode")}</Field>
        <Field label="Full Name" error={errors.fullName} full>{text("fullName")}</Field>
        <Field label="Mobile Number" error={errors.mobile}>{text("mobile", "tel", "10-digit number")}</Field>
        <Field label="Date of Birth" error={errors.dob}>{text("dob", "date")}</Field>
        <Field label="Gender" error={errors.gender} full>
          <div className="flex flex-wrap gap-2">
            {["Male", "Female", "Other"].map((g) => (
              <button type="button" key={g} onClick={() => set("gender", g)} className={`rounded-full border px-4 py-2 text-sm ${data.gender === g ? "border-me-gold-deep bg-me-gold font-semibold text-foreground" : "bg-card"}`}>{g}</button>
            ))}
          </div>
        </Field>
        <Field label="Full Residential Address" error={errors.address} full>
          <textarea className="field min-h-20" value={data.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="City" error={errors.city}>{text("city")}</Field>
        <Field label="PIN Code(s)" error={errors.pincodes} full>
          <div className="flex gap-2">
            <input
              className="field"
              inputMode="numeric"
              placeholder="Enter 6-digit PIN code"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPinInput(v);
                setPinError("");
                if (PIN_RE.test(v)) runLookup(v);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPin(); } }}
            />
            <button type="button" onClick={addPin} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-me-gold px-3 text-sm font-semibold text-foreground hover:opacity-90">
              <Plus className="size-4" /> Add
            </button>
          </div>
          {pinError && <span className="text-xs text-destructive">{pinError}</span>}
          {data.pincodes.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.pincodes.map((p) => {
                const a = pinAreas[p];
                return (
                  <div key={p} className="flex items-start justify-between gap-2 rounded-lg border border-me-gold/40 bg-card px-3 py-2 text-sm">
                    <span>
                      <span className="font-mono font-semibold">{p}</span>
                      {areaText(a) && <span className="block text-xs text-muted-foreground">{areaText(a)}</span>}
                    </span>
                    <button type="button" aria-label={`Remove ${p}`} onClick={() => removePin(p)} className="text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </Field>
      </div>

      <div className="h-px bg-me-gold/60" />

      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field label="Job Role (select all that apply)" error={errors.jobRoles} full>
          <div className="grid gap-2 sm:grid-cols-2">
            {JOB_ROLES.map((r) => {
              const on = data.jobRoles.includes(r);
              return (
                <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${on ? "border-me-gold-deep bg-me-gold/15 font-semibold" : "bg-card"}`}>
                  <input type="checkbox" className="size-4 accent-[var(--me-gold-deep)]" checked={on} onChange={() => toggle("jobRoles", r)} />
                  {r}
                </label>
              );
            })}
          </div>
          {data.jobRoles.includes("Other") && (
            <input className="field" placeholder="Specify other role" value={data.otherRole} onChange={(e) => set("otherRole", e.target.value)} />
          )}
          {errors.otherRole && <span className="text-xs text-destructive">{errors.otherRole}</span>}
        </Field>
        <Field label="Work Type" error={errors.workType} full>
          <div className="grid gap-2 sm:grid-cols-2">
            {WORK_TYPES.map((t) => {
              const on = data.workType.includes(t);
              return (
                <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${on ? "border-me-gold-deep bg-me-gold/15 font-semibold" : "bg-card"}`}>
                  <input type="checkbox" className="size-4 accent-[var(--me-gold-deep)]" checked={on} onChange={() => toggle("workType", t)} />
                  {t}
                </label>
              );
            })}
          </div>
        </Field>
        <Field label="Expected Salary (₹)" optional error={errors.salary}>{text("salary", "number")}</Field>
      </div>

      <div className="h-px bg-me-gold/60" />

      <div className="flex flex-col gap-3 p-6 sm:flex-row-reverse sm:items-center sm:p-8">
        <button type="button" onClick={submit} className="rounded-lg bg-me-gold px-6 py-3 text-sm font-bold text-foreground hover:opacity-90">Submit Registration</button>
        <button type="button" onClick={copyForm} className="inline-flex items-center justify-center gap-2 rounded-lg border border-me-gold-deep px-5 py-3 text-sm font-semibold text-me-gold-deep hover:bg-me-gold/10">
          <Copy className="size-4" /> {copied ? "Copied!" : "Copy Completed Form"}
        </button>
        <p className="text-xs text-muted-foreground sm:mr-auto">* Required fields</p>
      </div>

      <div className="bg-me-gold py-2 text-center text-xs font-semibold text-foreground">MAIDEAZY | Job Seeker Registration</div>
    </div>
  );
}
