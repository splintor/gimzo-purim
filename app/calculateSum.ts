function parseDMYDate(dateString: string) {
  const [day, month, year] = dateString.split('/').map(Number);
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
  const yearToUse = year < 100 ? year + currentCentury : year;
  return new Date(yearToUse, month - 1, day);
}

export function getDateAndTime(dateString: string, timeString: string) {
  const date = parseDMYDate(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  date.setHours(hours, minutes);
  return date;
}

function parseDiscount(value: string): number {
  const trimmed = (value ?? '').trim();
  const isPercent = trimmed.endsWith('%');
  const parsed = Number(isPercent ? trimmed.slice(0, -1) : trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid quantity discount in settings: ${JSON.stringify(value)}`);
  }
  return isPercent ? parsed / 100 : parsed;
}

export function calculateSum({ sendToAll, familiesCount, fadiha, settings }: {
  sendToAll: boolean;
  familiesCount: number;
  fadiha: boolean;
  settings: Record<string, string>;
}): number {
  if (sendToAll) {
    return Number(settings['עלות הזמנה לכל המושב']);
  }

  let sum = Number(settings['עלות הזמנה למשפחה']) * familiesCount;

  if (familiesCount >= Number(settings['מספר משפחות מינימלי להנחת כמות'])) {
    sum *= 1 - parseDiscount(settings['הנחת כמות']);
  }

  const fadihaEndDate = getDateAndTime(settings['תאריך לסיום הנחת ביטוח פדיחה'], settings['שעה לסיום הנחת ביטוח פדיחה']);
  if (fadiha && new Date() > fadihaEndDate && familiesCount >= Number(settings['מספר משפחות מינימלי לביטוח פדיחה'])) {
    sum += Number(settings['עלות ביטוח פדיחה']);
  }

  return sum;
}
