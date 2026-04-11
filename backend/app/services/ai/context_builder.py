def safe(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
    return value or None


def _pick(data: dict, *keys: str):
    for key in keys:
        value = safe(data.get(key))
        if value is not None:
            return value
    return None


def build_patient_context(data: dict) -> str:
    context: list[str] = []

    allergies = data.get("allergies", [])
    context.append("Allergies:")
    if allergies:
        for allergy in allergies:
            parts = [
                _pick(allergy, "allergy_type"),
                _pick(allergy, "body_location", "body_part") and f"Location: {_pick(allergy, 'body_location', 'body_part')}",
                _pick(allergy, "severity") and f"Severity: {_pick(allergy, 'severity')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    surgeries = data.get("surgeries", [])
    context.append("\nSurgeries:")
    if surgeries:
        for surgery in surgeries:
            parts = [
                _pick(surgery, "surgery_name", "type"),
                _pick(surgery, "surgery_date") and f"Date: {_pick(surgery, 'surgery_date')}",
                _pick(surgery, "admit_date") and f"Admitted: {_pick(surgery, 'admit_date')}",
                _pick(surgery, "discharge_date") and f"Discharged: {_pick(surgery, 'discharge_date')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    medications = data.get("medications", [])
    context.append("\nMedications:")
    if medications:
        for medication in medications:
            parts = [
                _pick(medication, "name", "medication_name"),
                _pick(medication, "dosage") and f"Dose: {_pick(medication, 'dosage')}",
                _pick(medication, "frequency") and f"Frequency: {_pick(medication, 'frequency')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    immunizations = data.get("immunizations", [])
    context.append("\nImmunizations:")
    if immunizations:
        for immunization in immunizations:
            parts = [
                _pick(immunization, "vaccine_name", "vaccine"),
                _pick(immunization, "vaccination_date", "date") and f"Date: {_pick(immunization, 'vaccination_date', 'date')}",
                _pick(immunization, "reason") and f"Reason: {_pick(immunization, 'reason')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    labs = data.get("labs", [])
    context.append("\nLab Results:")
    if labs:
        for lab in labs:
            parts = [
                _pick(lab, "test_name"),
                _pick(lab, "result_text", "result") and f"Result: {_pick(lab, 'result_text', 'result')}",
                _pick(lab, "test_date", "date") and f"Date: {_pick(lab, 'test_date', 'date')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    conditions = data.get("conditions", [])
    context.append("\nLong Term Conditions:")
    if conditions:
        for condition in conditions:
            parts = [
                _pick(condition, "condition_name", "condition"),
                _pick(condition, "current_condition", "status") and f"Status: {_pick(condition, 'current_condition', 'status')}",
                _pick(condition, "diagnosis") and f"Diagnosis: {_pick(condition, 'diagnosis')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    visits = data.get("visits", [])
    context.append("\nRecent Visits:")
    if visits:
        for visit in visits:
            parts = [
                _pick(visit, "chief_complaint", "reason"),
                _pick(visit, "diagnosis") and f"Diagnosis: {_pick(visit, 'diagnosis')}",
                _pick(visit, "visit_date", "date") and f"Date: {_pick(visit, 'visit_date', 'date')}",
            ]
            parts = [part for part in parts if part]
            if parts:
                context.append(f"- {', '.join(parts)}")
    else:
        context.append("- Not available in records")

    return "\n".join(context)
