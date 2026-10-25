import { useState, type ReactNode } from "react";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const JOB_ROLES = ["Maid / Housekeeper", "Driver", "Chef / Cook", "Waiter / Waitress", "Nurse / Caregiver", "Pet Caretaker", "Other"] as const;
const EMP_TYPES = ["Full-time", "Part-time", "Live-in", "Live-out"] as const;
const AVAILABILITY = ["Immediate", "15 Days", "30 Days", "More than 30 days"] as const;
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const altPhone = z.string().trim().refine((v) => v === "" || /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number");
const req = (m: string) => z.string().trim().min(1, m).max(200);

const schemas = [
  z.object({
    referenceCode: z.string().trim().max(50),
    fullName: req("Full name is required"),
    mobile: phone,
    whatsapp: phone,
    alternatePhone: altPhone,
    email: z.string().trim().email("Enter a valid email").max(255),
    dob: req("Date of birth is required"),
    gender: req("Select gender"),
  }),
  z.object({
    houseNo: req("House / Flat No. is required"),
    buildingName: z.string().trim().max(200),
    street: req("Street / Road / Lane is required"),
    landmark: z.string().trim().max(200),
    locality: req("Locality / Area / Sector is required"),
    city: req("City is required"),
    state: req("State is required"),
    pin: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  }),
  z.object({
    jobRole: req("Select a job role"),
    jobRoleOther: z.string().trim().max(100),
    locations: z.array(z.string().trim().min(1).max(100)).min(1, "Add at least one location or PIN code"),
    employmentType: z.array(z.string()).min(1, "Select at least one"),
    experience: req("Experience is required"),
    prevEmployer: z.string().trim().max(200),
    prevRole: z.string().trim().max(200),
    salary: req("Expected salary is required"),
    joinFrom: req("Select availability"),
  }).refine((d) => d.jobRole !== "Other" || d.jobRoleOther.length > 0, { path: ["jobRoleOther"], message: "Please specify the role" }),
  z.object({
    education: req("Qualification is required"),
    skills: z.string().trim().max(500),
    languages: req("Languages are required"),
  }),
  z.object({
    emName: req("Contact name is required"),
    emRelation: req("Relationship is required"),
    emNumber: phone,
  }),
  z.object({
    agreeAccuracy: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    criminal: req("Please select one option"),
    criminalDetails: z.string().trim().max(1000),
    agreePcc: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    agreeVerification: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    agreePrivacy: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  }).refine((d) => d.criminal !== "disclose" || d.criminalDetails.length > 0, { path: ["criminalDetails"], message: "Please provide details" }),
  z.object({
    confirmReview: z.literal(true, { errorMap: () => ({ message: "Please confirm" }) }),
  }),
];

const STEPS = ["Personal", "Address", "Job", "Education", "Emergency", "Declaration", "Confirm"];
const today = new Date().toISOString().slice(0, 10);

const initial = {
  referenceCode: "", fullName: "", mobile: "", whatsapp: "", alternatePhone: "", email: "", dob: "", gender: "",
  houseNo: "", buildingName: "", street: "", landmark: "", locality: "", city: "", state: "", pin: "",
  jobRole: "", jobRoleOther: "", locations: [] as string[], employmentType: [] as string[], experience: "", prevEmployer: "", prevRole: "", salary: "", joinFrom: "",
  education: "", skills: "", languages: "",
  emName: "", emRelation: "", emNumber: "",
  agreeAccuracy: false, criminal: "", criminalDetails: "", agreePcc: false, agreeVerification: false, agreePrivacy: false,
  confirmReview: false,
};
type Data = typeof initial;
type K = keyof Data;

function Field({ label, error, children, optional, full }: { label: string; error?: string | undefined; children: ReactNode; optional?: boolean; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Consent({ checked, onChange, title, text, error }: { checked: boolean; onChange: (v: boolean) => void; title: string; text: string; error?: string | undefined }) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <label className="mt-3 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        I agree.
      </label>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function HireForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>(initial);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  const [done, setDone] = useState<string | null>(null);
  const [locInput, setLocInput] = useState("");

  const set = <T extends K>(k: T, v: Data[T]) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const text = (k: K, type = "text", placeholder = "") => (
    <input className="field" type={type} placeholder={placeholder} value={data[k] as string} max={type === "date" && k === "dob" ? today : undefined} onChange={(e) => set(k, e.target.value as never)} />
  );

  const addLocation = () => {
    const v = locInput.trim();
    if (!v || data.locations.includes(v)) { setLocInput(""); return; }
    set("locations", [...data.locations, v]);
    setLocInput("");
  };
  const removeLocation = (v: string) => set("locations", data.locations.filter((x) => x !== v));

  const validate = () => {
    const r = schemas[step]!.safeParse(data);
    if (r.success) { setErrors({}); return true; }
    const e: Partial<Record<K, string>> = {};
    r.error.issues.forEach((i) => { const k = i.path[0] as K; if (!e[k]) e[k] = i.message; });
    setErrors(e);
    return false;
  };
  const next = () => {
    if (!validate()) return;
    if (step === STEPS.length - 1) {
      setDone("HV-" + Date.now().toString().slice(-8));
      console.log("Submitted registration", data);
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-card p-10 text-center shadow-card">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success text-primary-foreground"><Check className="size-8" /></div>
        <h2 className="mt-5 text-2xl font-bold">Registration submitted</h2>
        <p className="mt-2 text-muted-foreground">Thank you, {data.fullName}. Our team will contact you soon.</p>
        <p className="mt-4 inline-block rounded-md bg-secondary px-4 py-2 font-mono text-secondary-foreground">Registration ID: {done}</p>
        <div><button className="mt-6 text-sm font-semibold text-primary underline" onClick={() => { setData(initial); setStep(0); setDone(null); setLocInput(""); }}>Register another candidate</button></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-card">
      <ol className="flex gap-1 overflow-x-auto border-b p-4 sm:p-6">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 min-w-[72px] flex-col items-center gap-1.5">
            <span className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${i < step ? "bg-success text-primary-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={`text-xs ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-bold">
          {["1. Personal Details", "2. Address Details", "3. Job Details", "4. Education & Skills", "5. Emergency Contact Details", "6. Declaration & Consent", "7. Candidate Confirmation"][step]}
        </h2>

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Reference Code" optional error={errors.referenceCode}>{text("referenceCode")}</Field>
            <Field label="Full Name" error={errors.fullName}>{text("fullName")}</Field>
            <Field label="Mobile Number" error={errors.mobile}>{text("mobile", "tel", "10-digit number")}</Field>
            <Field label="WhatsApp Number" error={errors.whatsapp}>
              {text("whatsapp", "tel", "10-digit number")}
              <button type="button" className="self-start text-xs font-semibold text-primary" onClick={() => set("whatsapp", data.mobile)}>Same as mobile</button>
            </Field>
            <Field label="Alternate Phone Number" optional error={errors.alternatePhone}>{text("alternatePhone", "tel", "10-digit number")}</Field>
            <Field label="Email Address" error={errors.email}>{text("email", "email")}</Field>
            <Field label="Date of Birth" error={errors.dob}>{text("dob", "date")}</Field>
            <Field label="Gender" error={errors.gender} full>
              <div className="flex flex-wrap gap-2">
                {["Male", "Female", "Other"].map((g) => (
                  <button type="button" key={g} onClick={() => set("gender", g)} className={`rounded-full border px-4 py-2 text-sm ${data.gender === g ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{g}</button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">Full Residential Address</p>
            <Field label="House / Flat No." error={errors.houseNo}>{text("houseNo", "text", "e.g., Flat 402")}</Field>
            <Field label="Building / House Name" optional error={errors.buildingName}>{text("buildingName", "text", "e.g., Sea Breeze Towers")}</Field>
            <Field label="Street / Road / Lane" error={errors.street} full>{text("street", "text", "e.g., 5th Main Road, Lane No. 2")}</Field>
            <Field label="Landmark" optional error={errors.landmark} full>{text("landmark", "text", "e.g., Near Metro Station")}</Field>
            <Field label="Locality / Area / Sector" error={errors.locality}>{text("locality", "text", "e.g., Indiranagar, Sector 62")}</Field>
            <Field label="City" error={errors.city}>{text("city", "text", "e.g., Mumbai, Bengaluru")}</Field>
            <Field label="State" error={errors.state}>{text("state", "text", "e.g., Maharashtra, Karnataka")}</Field>
            <Field label="PIN Code" error={errors.pin}>{text("pin", "text", "6 digits")}</Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Job Role Applied For" error={errors.jobRole} full>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {JOB_ROLES.map((r) => (
                  <button type="button" key={r} onClick={() => set("jobRole", r)} className={`rounded-lg border px-3 py-3 text-left text-sm ${data.jobRole === r ? "border-primary bg-secondary font-semibold text-secondary-foreground" : "bg-card"}`}>{r}</button>
                ))}
              </div>
            </Field>
            {data.jobRole === "Other" && <Field label="Specify other role" error={errors.jobRoleOther} full>{text("jobRoleOther")}</Field>}
            <Field label="Preferred Job Location(s) / PIN Code(s)" error={errors.locations} full>
              <div className="flex gap-2">
                <input
                  className="field"
                  placeholder="e.g., Andheri West, 400053"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocation(); } }}
                />
                <button type="button" onClick={addLocation} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Plus className="size-4" /> Add
                </button>
              </div>
              {data.locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.locations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                      {loc}
                      <button type="button" aria-label={`Remove ${loc}`} onClick={() => removeLocation(loc)} className="text-secondary-foreground hover:text-destructive"><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Total Work Experience" error={errors.experience}>
              <select className="field" value={data.experience} onChange={(e) => set("experience", e.target.value)}>
                <option value="">Select</option>
                {["Fresher", "Less than 1 year", "1–2 years", "3–5 years", "5–10 years", "10+ years"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Employment Type" error={errors.employmentType} full>
              <div className="flex flex-wrap gap-2">
                {EMP_TYPES.map((t) => {
                  const on = data.employmentType.includes(t);
                  return <button type="button" key={t} onClick={() => set("employmentType", on ? data.employmentType.filter((x) => x !== t) : [...data.employmentType, t])} className={`rounded-full border px-4 py-2 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{t}</button>;
                })}
              </div>
            </Field>
            <Field label="Previous Employer / Company" optional>{text("prevEmployer")}</Field>
            <Field label="Previous Job Role" optional>{text("prevRole")}</Field>
            <Field label="Expected Salary (₹ / month)" error={errors.salary}>{text("salary", "number")}</Field>
            <Field label="Available to Join From" error={errors.joinFrom} full>
              <div className="grid gap-2 sm:grid-cols-2">
                {AVAILABILITY.map((a) => (
                  <label key={a} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${data.joinFrom === a ? "border-primary bg-secondary font-semibold text-secondary-foreground" : "bg-card"}`}>
                    <input type="radio" name="joinFrom" className="size-4 accent-[var(--primary)]" checked={data.joinFrom === a} onChange={() => set("joinFrom", a)} />
                    {a}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5">
            <Field label="Highest Educational Qualification" error={errors.education}>
              <select className="field" value={data.education} onChange={(e) => set("education", e.target.value)}>
                <option value="">Select</option>
                {["No formal education", "Below 10th", "10th Pass", "12th Pass", "Diploma / ITI", "Graduate", "Post Graduate"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Skills / Special Training" optional>
              <textarea className="field min-h-24" value={data.skills} onChange={(e) => set("skills", e.target.value)} />
            </Field>
            <Field label="Languages Known" error={errors.languages}>{text("languages", "text", "e.g. Hindi, English")}</Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Emergency Contact Name" error={errors.emName} full>{text("emName")}</Field>
            <Field label="Relationship" error={errors.emRelation}>{text("emRelation")}</Field>
            <Field label="Emergency Contact Number" error={errors.emNumber}>{text("emNumber", "tel")}</Field>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4">
            <Consent title="A. Information Accuracy" checked={data.agreeAccuracy} onChange={(v) => set("agreeAccuracy", v)} error={errors.agreeAccuracy}
              text="I declare that the information provided in this registration form is true and accurate to the best of my knowledge. I understand that providing false or misleading information may affect my registration or placement." />
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-semibold">B. Criminal Record Declaration</h4>
              <p className="mt-1 text-sm text-muted-foreground">Please select one:</p>
              {([["none", "I declare that, to the best of my knowledge, I have no criminal record."], ["disclose", "I need to disclose information for review."]] as const).map(([v, l]) => (
                <label key={v} className="mt-2 flex items-start gap-2 text-sm">
                  <input type="radio" name="criminal" className="mt-0.5 size-4 accent-[var(--primary)]" checked={data.criminal === v} onChange={() => set("criminal", v)} />{l}
                </label>
              ))}
              {errors.criminal && <span className="text-xs text-destructive">{errors.criminal}</span>}
              {data.criminal === "disclose" && (
                <div className="mt-3">
                  <textarea className="field min-h-20" placeholder="Please provide details" value={data.criminalDetails} onChange={(e) => set("criminalDetails", e.target.value)} />
                  {errors.criminalDetails && <span className="text-xs text-destructive">{errors.criminalDetails}</span>}
                </div>
              )}
            </div>
            <Consent title="C. Police Clearance Certificate (PCC)" checked={data.agreePcc} onChange={(v) => set("agreePcc", v)} error={errors.agreePcc}
              text="I agree to submit a valid Police Clearance Certificate (PCC) before joining or within 30 days from my joining date, wherever applicable and legally required. I agree to cooperate with the required verification process and provide genuine documents." />
            <Consent title="D. Identity & Background Verification" checked={data.agreeVerification} onChange={(v) => set("agreeVerification", v)} error={errors.agreeVerification}
              text="I agree to cooperate with lawful identity and background verification procedures. I understand that any discrepancy or safety concern may be reviewed and appropriate action may be taken in accordance with applicable laws and agreements." />
            <Consent title="E. Privacy & Data Consent" checked={data.agreePrivacy} onChange={(v) => set("agreePrivacy", v)} error={errors.agreePrivacy}
              text="I consent to HIRE-VIA using my personal information for legitimate registration, verification, recruitment, and job-placement purposes, subject to applicable privacy laws." />
          </div>
        )}

        {step === 6 && (
          <div className="grid gap-5">
            <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
              <p className="font-semibold">Summary</p>
              <p className="mt-1">{data.fullName} · {data.mobile} · {data.email}</p>
              <p>{data.houseNo}, {data.buildingName ? data.buildingName + ", " : ""}{data.street}, {data.locality}, {data.city}, {data.state} – {data.pin}</p>
              <p>{data.jobRole === "Other" ? data.jobRoleOther : data.jobRole} · {data.employmentType.join(", ")} · {data.locations.join(", ")}</p>
              <p>Available to join: {data.joinFrom}</p>
              <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => setStep(0)}>Edit details</button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={data.confirmReview} onChange={(e) => set("confirmReview", e.target.checked)} />
              I confirm that I have reviewed the information provided and agree to the declarations and consents selected above.
            </label>
            {errors.confirmReview && <span className="text-xs text-destructive">{errors.confirmReview}</span>}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-40">
            <ChevronLeft className="size-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {step === STEPS.length - 1 ? "Submit" : "Next"} <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
