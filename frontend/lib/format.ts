export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatVND(value: number) { return `${new Intl.NumberFormat('vi-VN').format(value)} ₫` }
export function formatDate(value: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: VIETNAM_TIME_ZONE }).format(new Date(value)) }
export function formatTimeRange(start: string, end: string) { return `${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: VIETNAM_TIME_ZONE }).format(new Date(start))} – ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: VIETNAM_TIME_ZONE }).format(new Date(end))}` }
export function hoursBetween(start: string, end: string) { return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3600000) }

export function vietnamDateInputValue(date = new Date()) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: VIETNAM_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)
	const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
	return `${values.year}-${values.month}-${values.day}`
}

export function vietnamTimeValue(date = new Date()) {
	return new Intl.DateTimeFormat('en-GB', {
		timeZone: VIETNAM_TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(date)
}

/** Convert a venue wall-clock value into an unambiguous instant. */
export function vietnamLocalIso(date: string, time: string) {
	return new Date(`${date}T${time}:00+07:00`).toISOString()
}
