import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── BlurText: words animate from blurred to focused ────── */
function BlurText({ text, delay = 80, style = {} }) {
  const words = text.split(" ");
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: "0.3em", justifyContent: "center", ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(12px)", opacity: 0, y: 12 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: i * (delay / 1000), ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── GradientText: animated gradient sweep ──────────────── */
function GradientText({ children, colors = ["#6fcf97", "#4ecdc4", "#a8edea"], speed = 4, style = {} }) {
  const gradient = `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`;
  return (
    <span style={{
      background: gradient,
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: `gvGradientSweep ${speed}s linear infinite`,
      ...style,
    }}>
      {children}
    </span>
  );
}

/* ── AnimatedContent: scroll-triggered fade/slide ───────── */
function AnimatedContent({ children, direction = "up", delay = 0, style = {} }) {
  const yMap = { up: 40, down: -40 };
  const xMap = { left: 40, right: -40 };
  return (
    <motion.div
      initial={{ opacity: 0, y: yMap[direction] || 0, x: xMap[direction] || 0 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

const BENEFITS = [
  { icon: "♻", title: "Reduce Waste", desc: "Keep high-quality lens materials out of landfills. Your old lenses can be repurposed instead of discarded." },
  { icon: "₱", title: "Save on Your Next Pair", desc: "Recyclers may receive discounts on future OPTIQ orders as a thank-you for contributing to our circular model." },
  { icon: "◎", title: "Material Recovery", desc: "Lenses contain valuable optical-grade materials — polycarbonate, CR-39, and high-index polymers worth reclaiming." },
];

const LENS_TYPES = ["Single Vision", "Bifocal", "Progressive / Multifocal", "Photochromic", "Blue Light Filter", "Unsure"];
const LENS_MATERIALS = ["Glass", "Polycarbonate", "CR-39 Plastic", "Trivex", "High-Index", "Unsure"];
const LENS_CONDITIONS = ["Good — minor scratches only", "Fair — noticeable wear", "Poor — cracked or heavily damaged"];

const INITIAL_FORM = {
  name: "", email: "", phone: "", city: "",
  lensType: "", lensMaterial: "", lensCondition: "",
  prescription: "", pairs: 1, notes: "",
};

const inputBase = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 500, letterSpacing: 0.5,
  opacity: 0.75, marginBottom: 6,
};

export default function LensRecycle() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = "gv-recycle-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      * { box-sizing: border-box; }
      @keyframes gvGradientSweep { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
      .recycle-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .recycle-form-grid .full-width { grid-column: 1 / -1; }
      @media (max-width: 600px) {
        .recycle-form-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .recycle-benefits-grid { grid-template-columns: 1fr !important; }
      }
      .recycle-input:focus { border-color: rgba(111,207,151,0.5) !important; }
      .recycle-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ffffff' opacity='0.5' d='M1 1l5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
      .recycle-select option { background: #1a1a2e; color: #fff; }
    `;
    document.head.appendChild(s);
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.lensType) errs.lensType = "Select a lens type";
    if (!form.lensCondition) errs.lensCondition = "Select lens condition";
    if (!form.pairs || form.pairs < 1) errs.pairs = "At least 1 pair";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
  };

  const renderField = (key, label, type = "text", opts = {}) => {
    const { required, fullWidth, placeholder, ...rest } = opts;
    return (
      <div className={fullWidth ? "full-width" : ""}>
        <label style={labelStyle}>{label}{required && <span style={{ color: "#6fcf97" }}> *</span>}</label>
        <input
          className="recycle-input"
          type={type}
          value={form[key]}
          onChange={set(key)}
          placeholder={placeholder || ""}
          style={{ ...inputBase, ...(errors[key] ? { borderColor: "rgba(255,100,100,0.6)" } : {}) }}
          {...rest}
        />
        {errors[key] && <p style={{ fontSize: 11, color: "#ff6b6b", margin: "4px 0 0", opacity: 0.9 }}>{errors[key]}</p>}
      </div>
    );
  };

  const renderSelect = (key, label, options, opts = {}) => {
    const { required, fullWidth } = opts;
    return (
      <div className={fullWidth ? "full-width" : ""}>
        <label style={labelStyle}>{label}{required && <span style={{ color: "#6fcf97" }}> *</span>}</label>
        <select
          className="recycle-input recycle-select"
          value={form[key]}
          onChange={set(key)}
          style={{ ...inputBase, cursor: "pointer", ...(errors[key] ? { borderColor: "rgba(255,100,100,0.6)" } : {}), ...(!form[key] ? { opacity: 0.4 } : {}) }}
        >
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {errors[key] && <p style={{ fontSize: 11, color: "#ff6b6b", margin: "4px 0 0", opacity: 0.9 }}>{errors[key]}</p>}
      </div>
    );
  };

  const renderTextarea = (key, label, opts = {}) => {
    const { fullWidth, placeholder, rows = 3 } = opts;
    return (
      <div className={fullWidth ? "full-width" : ""}>
        <label style={labelStyle}>{label}</label>
        <textarea
          className="recycle-input"
          value={form[key]}
          onChange={set(key)}
          placeholder={placeholder || ""}
          rows={rows}
          style={{ ...inputBase, resize: "vertical", minHeight: 60 }}
        />
      </div>
    );
  };

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", textAlign: "left", boxSizing: "border-box", overflowX: "hidden" }}>

      {/* HERO */}
      <section style={{ paddingTop: 60, paddingBottom: 50, textAlign: "center" }}>
        <AnimatedContent>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.55, marginBottom: 20, fontWeight: 600 }}>
            Lens Recycling Program
          </p>
        </AnimatedContent>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 500, lineHeight: 1.15, margin: "0 0 24px", color: "#fff" }}>
          <BlurText text="Recycle Your Lenses." delay={100} />
        </h1>

        <AnimatedContent delay={0.3}>
          <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.7, maxWidth: 600, margin: "0 auto 16px" }}>
            Lenses are the most expensive part of any pair of glasses.
            Instead of throwing them away, <GradientText>give them a second life</GradientText>.
          </p>
        </AnimatedContent>

        <AnimatedContent delay={0.5}>
          <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.6, maxWidth: 580, margin: "0 auto" }}>
            Fill out the form below and our team will reach out with instructions on how to send in your old lenses for recycling or repurposing.
          </p>
        </AnimatedContent>
      </section>

      {/* BENEFITS */}
      <section className="recycle-benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 60 }}>
        {BENEFITS.map((b, i) => (
          <AnimatedContent key={i} delay={i * 0.1} style={{ display: "flex", height: "100%" }}>
            <div style={{
              flex: 1, padding: "28px 20px", borderRadius: 16, textAlign: "center",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500, margin: 0 }}>{b.title}</p>
              <p style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.6, margin: 0 }}>{b.desc}</p>
            </div>
          </AnimatedContent>
        ))}
      </section>

      {/* FORM */}
      <section>
        <AnimatedContent>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 12, fontWeight: 600 }}>
              Submit Your Lenses
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 500, margin: 0, lineHeight: 1.2, color: "#fff" }}>
              Recycling <GradientText colors={["#6fcf97", "#4ecdc4", "#88d8c0"]}>Request Form</GradientText>
            </h2>
          </div>
        </AnimatedContent>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
              style={{
                maxWidth: 680, margin: "0 auto",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: "32px 28px",
              }}
            >
              <div className="recycle-form-grid">
                {renderField("name", "Full Name", "text", { required: true, placeholder: "Juan Dela Cruz" })}
                {renderField("email", "Email Address", "email", { required: true, placeholder: "juan@email.com" })}
                {renderField("phone", "Phone Number", "tel", { placeholder: "+63 9XX XXX XXXX" })}
                {renderField("city", "City / Municipality", "text", { required: true, placeholder: "Quezon City" })}
                {renderSelect("lensType", "Lens Type", LENS_TYPES, { required: true })}
                {renderSelect("lensMaterial", "Lens Material", LENS_MATERIALS)}
                {renderSelect("lensCondition", "Lens Condition", LENS_CONDITIONS, { required: true })}
                {renderField("pairs", "Number of Pairs", "number", { required: true, min: 1, max: 10 })}
                {renderTextarea("prescription", "Prescription (if known)", { fullWidth: true, placeholder: "e.g. OD -2.50, OS -3.00", rows: 2 })}
                {renderTextarea("notes", "Additional Notes", { fullWidth: true, placeholder: "Any other details about your lenses...", rows: 3 })}
              </div>

              <div style={{ textAlign: "center", marginTop: 28 }}>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "linear-gradient(135deg, #6fcf97, #4ecdc4)",
                    color: "#0a0a1a", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                    border: "none", borderRadius: 12, padding: "14px 48px",
                    cursor: "pointer", transition: "opacity 0.2s",
                  }}
                >
                  Submit Request
                </motion.button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                maxWidth: 580, margin: "0 auto", textAlign: "center",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: "48px 32px",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6fcf97, #4ecdc4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px", fontSize: 28, color: "#0a0a1a",
                }}
              >
                ✓
              </motion.div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 500, margin: "0 0 12px", color: "#fff" }}>
                Submission Received!
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.7, margin: "0 0 8px" }}>
                Thank you, <strong style={{ opacity: 1 }}>{form.name}</strong>. We've received your recycling request
                for <strong style={{ opacity: 1 }}>{form.pairs} pair{form.pairs > 1 ? "s" : ""}</strong> of lenses.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.6, margin: "0 0 28px" }}>
                Our team will contact you at <strong style={{ opacity: 0.85 }}>{form.email}</strong> with
                instructions on how to send in your lenses.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={resetForm}
                style={{
                  background: "rgba(255,255,255,0.08)", color: "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: 500, letterSpacing: 1, textTransform: "uppercase",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  padding: "10px 32px", cursor: "pointer",
                }}
              >
                Submit Another
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
