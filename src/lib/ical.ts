/**
 * Channel Manager — génération et parsing iCal (RFC 5545).
 *
 * Export : GestHotel publie un calendrier .ics par type de chambre, listant les
 *          périodes réservées. Les OTA (Booking.com, Airbnb…) l'importent et
 *          bloquent ces dates → anti-surbooking.
 *
 * Import : GestHotel lit les .ics fournis par les OTA et crée des réservations
 *          de blocage pour ne pas vendre une chambre déjà prise ailleurs.
 */

// ── Helpers de formatage ────────────────────────────────────────────────────

/** Formate une date YYYY-MM-DD en date iCal (YYYYMMDD). */
function toICalDate(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, '');
}

/** Échappe les caractères spéciaux iCal dans une valeur texte. */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Plie les lignes à 75 octets (RFC 5545) avec espace de continuation. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return chunks.join('\r\n');
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15) + 'Z';
}

// ── Export : génération du fichier .ics ──────────────────────────────────────

export type ICalEvent = {
  uid: string;
  start: string;   // YYYY-MM-DD (arrivée)
  end: string;     // YYYY-MM-DD (départ, exclusif en iCal)
  summary: string;
};

/**
 * Génère un calendrier iCal complet à partir d'une liste d'événements.
 */
export function generateICalFeed(params: {
  calendarName: string;
  events: ICalEvent[];
}): string {
  const { calendarName, events } = params;
  const stamp = nowStamp();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GestHotel//Channel Manager//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:${escapeICalText(calendarName)}`),
  ];

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${ev.uid}`));
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${toICalDate(ev.start)}`);
    lines.push(`DTEND;VALUE=DATE:${toICalDate(ev.end)}`);
    lines.push(foldLine(`SUMMARY:${escapeICalText(ev.summary)}`));
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

// ── Import : parsing d'un fichier .ics ───────────────────────────────────────

export type ParsedEvent = {
  uid: string;
  start: string;   // YYYY-MM-DD
  end: string;     // YYYY-MM-DD (exclusif)
  summary: string;
};

/** Convertit une valeur de date iCal (YYYYMMDD ou YYYYMMDDTHHMMSSZ) en YYYY-MM-DD. */
function parseICalDate(value: string): string | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * Parse un contenu .ics et retourne les événements (périodes réservées).
 * Robuste au line-folding et aux variantes de format DTSTART/DTEND.
 */
export function parseICalFeed(content: string): ParsedEvent[] {
  // Dé-plier les lignes (une ligne commençant par espace/tab continue la précédente)
  const rawLines = content.split(/\r?\n/);
  const unfolded: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  const events: ParsedEvent[] = [];
  let current: Partial<ParsedEvent> | null = null;

  for (const line of unfolded) {
    const upper = line.toUpperCase();

    if (upper === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (upper === 'END:VEVENT') {
      if (current && current.start && current.end) {
        events.push({
          uid: current.uid || `gen-${current.start}-${current.end}-${Math.random().toString(36).slice(2, 8)}`,
          start: current.start,
          end: current.end,
          summary: current.summary || 'Réservé (OTA)',
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const keyPart = line.slice(0, colonIdx).toUpperCase();
    const value = line.slice(colonIdx + 1).trim();

    if (keyPart === 'UID') {
      current.uid = value;
    } else if (keyPart.startsWith('DTSTART')) {
      const d = parseICalDate(value);
      if (d) current.start = d;
    } else if (keyPart.startsWith('DTEND')) {
      const d = parseICalDate(value);
      if (d) current.end = d;
    } else if (keyPart.startsWith('SUMMARY')) {
      current.summary = value
        .replace(/\\n/g, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\');
    }
  }

  return events;
}
