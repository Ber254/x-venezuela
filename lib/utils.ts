export const PSIC_COLORS = [
  '#1D9E75','#534AB7','#D85A30','#D4537E',
  '#378ADD','#BA7517','#639922','#E24B4A',
]

export const DAYS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
export const DAYS_FULL  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
export const MONTHS     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function mondayOf(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - day + (day === 0 ? -6 : 1))
  r.setHours(0, 0, 0, 0)
  return r
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function slotsFromShift(start: string, end: string): string[] {
  const slots: string[] = []
  const [sh] = start.split(':').map(Number)
  const [eh] = end.split(':').map(Number)
  for (let h = sh; h < eh; h++) slots.push(String(h).padStart(2, '0') + ':00')
  return slots
}

export function hourEnd(hour: string): string {
  return String(parseInt(hour) + 1).padStart(2, '0') + ':00'
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}
