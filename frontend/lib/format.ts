export function formatVND(value: number) { return `${new Intl.NumberFormat('vi-VN').format(value)} ₫` }
export function formatDate(value: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) }
export function formatTimeRange(start: string, end: string) { return `${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(start))} – ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(end))}` }
export function hoursBetween(start: string, end: string) { return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3600000) }
