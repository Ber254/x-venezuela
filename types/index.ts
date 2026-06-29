export type Role = 'superadmin' | 'admin' | 'psic' | 'user'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  specialty?: string
  color?: string
  active: boolean
  created_at: string
}

export interface Availability {
  id: string
  psic_id: string
  days: number[]          // 0=Sun … 6=Sat
  shifts: { start: string; end: string }[]
  valid_from: string
  valid_until: string
  created_at: string
  profile?: Profile
}

export interface Booking {
  id: string
  date: string            // YYYY-MM-DD
  hour: string            // HH:00
  psic_id: string
  patient_id: string
  meet_link?: string
  calendar_event_id?: string
  created_at: string
  psic?: Profile
  patient?: Profile
}

export interface Absence {
  id: string
  booking_id: string
  date: string
  hour: string
  psic_id: string
  patient_id: string
  patient_name: string
  patient_email: string
  registered_by: string
  registered_at: string
}
