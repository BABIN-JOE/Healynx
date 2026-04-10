def safe(val):
    return val if val else None


def format_line(label: str, value: str):
    return f"- {label}: {value}" if value else None


def build_patient_context(data: dict) -> str:
    context = []

    # =========================
    # ALLERGIES
    # =========================
    allergies = data.get("allergies", [])
    context.append("Allergies:")

    if allergies:
        for a in allergies:
            allergy = safe(a.get("allergy_type"))
            severity = safe(a.get("severity"))
            body = safe(a.get("body_location"))

            parts = []
            if allergy:
                parts.append(allergy)
            if body:
                parts.append(f"Location: {body}")
            if severity:
                parts.append(f"Severity: {severity}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # SURGERIES
    # =========================
    surgeries = data.get("surgeries", [])
    context.append("\nSurgeries:")

    if surgeries:
        for s in surgeries:
            name = safe(s.get("type") or s.get("surgery_name"))
            admit = safe(s.get("admit_date"))
            surgery_date = safe(s.get("surgery_date"))
            discharge = safe(s.get("discharge_date"))

            parts = []
            if name:
                parts.append(name)
            if surgery_date:
                parts.append(f"Date: {surgery_date}")
            if admit:
                parts.append(f"Admitted: {admit}")
            if discharge:
                parts.append(f"Discharged: {discharge}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # MEDICATIONS (future ready)
    # =========================
    medications = data.get("medications", [])
    context.append("\nMedications:")

    if medications:
        for m in medications:
            name = safe(m.get("name"))
            dose = safe(m.get("dosage"))
            freq = safe(m.get("frequency"))

            parts = []
            if name:
                parts.append(name)
            if dose:
                parts.append(f"Dose: {dose}")
            if freq:
                parts.append(f"Frequency: {freq}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # IMMUNIZATIONS
    # =========================
    immunizations = data.get("immunizations", [])
    context.append("\nImmunizations:")

    if immunizations:
        for i in immunizations:
            vaccine = safe(i.get("vaccine"))
            date = safe(i.get("date"))

            parts = []
            if vaccine:
                parts.append(vaccine)
            if date:
                parts.append(f"Date: {date}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # LAB RESULTS
    # =========================
    labs = data.get("labs", [])
    context.append("\nLab Results:")

    if labs:
        for l in labs:
            test = safe(l.get("test_name"))
            result = safe(l.get("result"))
            date = safe(l.get("date"))

            parts = []
            if test:
                parts.append(test)
            if result:
                parts.append(f"Result: {result}")
            if date:
                parts.append(f"Date: {date}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # LONG TERM CONDITIONS
    # =========================
    conditions = data.get("conditions", [])
    context.append("\nLong Term Conditions:")

    if conditions:
        for c in conditions:
            name = safe(c.get("condition"))
            status = safe(c.get("status"))

            parts = []
            if name:
                parts.append(name)
            if status:
                parts.append(f"Status: {status}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    # =========================
    # VISITS
    # =========================
    visits = data.get("visits", [])
    context.append("\nRecent Visits:")

    if visits:
        for v in visits:
            reason = safe(v.get("reason"))
            diagnosis = safe(v.get("diagnosis"))
            date = safe(v.get("date"))

            parts = []
            if reason:
                parts.append(reason)
            if diagnosis:
                parts.append(f"Diagnosis: {diagnosis}")
            if date:
                parts.append(f"Date: {date}")

            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    return "\n".join(context)