// Parses the documented flat-row template format exported from a Google
// Sheet tab (or any CSV in the same shape). One row = one exercise phase;
// consecutive rows sharing the same Section+Group+Exercise become a single
// template exercise with multiple phases. Blank Section/Group/Exercise/
// Video/Category cells fill down from the row above, so a coach can use
// merged cells in Sheets naturally.

export type ParsedPhase = {
  label: string;
  sets: string;
  reps: string;
  rpe: string;
  rest: string;
};

export type ParsedExerciseEntry = {
  section: string;
  supersetGroup: string;
  exerciseName: string;
  video: string;
  category: string;
  notes: string;
  phases: ParsedPhase[];
};

// Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes
// ("" inside a quoted field), and commas/newlines inside quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // skip, \n handles the line break
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const HEADER_ALIASES: Record<string, keyof ColumnIndexes> = {
  section: "section",
  group: "group",
  supersetgroup: "group",
  exercise: "exercise",
  video: "video",
  category: "category",
  phase: "phase",
  sets: "sets",
  reps: "reps",
  rpe: "rpe",
  rest: "rest",
  notes: "notes",
};

type ColumnIndexes = {
  section?: number;
  group?: number;
  exercise?: number;
  video?: number;
  category?: number;
  phase?: number;
  sets?: number;
  reps?: number;
  rpe?: number;
  rest?: number;
  notes?: number;
};

function cell(row: string[], index: number | undefined): string {
  if (index == null) return "";
  return (row[index] ?? "").trim();
}

export function parseFlatTemplateRows(rows: string[][]): ParsedExerciseEntry[] {
  if (rows.length === 0) return [];

  const headerRow = rows[0];
  const columns: ColumnIndexes = {};
  headerRow.forEach((raw, index) => {
    const key = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
    const mapped = HEADER_ALIASES[key];
    if (mapped) columns[mapped] = index;
  });

  if (columns.exercise == null) {
    throw new Error('No "Exercise" column found in the header row.');
  }

  const entries: ParsedExerciseEntry[] = [];
  let lastSection = "";
  let lastGroup = "";
  let lastExercise = "";
  let lastVideo = "";
  let lastCategory = "";
  let currentKey: string | null = null;

  for (const row of rows.slice(1)) {
    const rawExercise = cell(row, columns.exercise);
    const section = cell(row, columns.section) || lastSection;
    const group = cell(row, columns.group) || lastGroup;
    const video = cell(row, columns.video) || lastVideo;
    const category = cell(row, columns.category) || lastCategory;
    const exerciseName = rawExercise || lastExercise;

    lastSection = section;
    lastGroup = group;
    lastVideo = video;
    lastCategory = category;
    lastExercise = exerciseName;

    if (!exerciseName) continue;

    const phase: ParsedPhase = {
      label: cell(row, columns.phase),
      sets: cell(row, columns.sets),
      reps: cell(row, columns.reps),
      rpe: cell(row, columns.rpe),
      rest: cell(row, columns.rest),
    };
    const notes = cell(row, columns.notes);

    const key = `${section}|${group}|${exerciseName}`;

    if (key === currentKey && entries.length > 0) {
      entries[entries.length - 1].phases.push(phase);
      if (notes && !entries[entries.length - 1].notes) entries[entries.length - 1].notes = notes;
    } else {
      entries.push({
        section,
        supersetGroup: group,
        exerciseName,
        video,
        category,
        notes,
        phases: [phase],
      });
      currentKey = key;
    }
  }

  return entries;
}
