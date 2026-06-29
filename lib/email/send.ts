import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY ?? 'placeholder') }
const FROM = process.env.RESEND_FROM ?? 'noreply@parcuve.com'

export async function sendBookingConfirmation({
  patientEmail, patientName,
  psicEmail, psicName,
  date, hour, meetLink,
}: {
  patientEmail: string; patientName: string
  psicEmail: string;    psicName: string
  date: string; hour: string; meetLink?: string
}) {
  const hEnd = `${String(parseInt(hour) + 1).padStart(2, '0')}:00`
  const meetSection = meetLink
    ? `<p>🎥 <strong>Enlace Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>`
    : ''

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#1D9E75">Turno confirmado — Parcuve Sin Fronteras</h2>
      <p>Hola <strong>${patientName}</strong>,</p>
      <p>Tu turno fue confirmado exitosamente.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;background:#F1EFE8;font-weight:600">Fecha</td><td style="padding:8px">${date}</td></tr>
        <tr><td style="padding:8px;background:#F1EFE8;font-weight:600">Horario</td><td style="padding:8px">${hour} – ${hEnd}</td></tr>
        <tr><td style="padding:8px;background:#F1EFE8;font-weight:600">Profesional</td><td style="padding:8px">${psicName}</td></tr>
      </table>
      ${meetSection}
      <p style="color:#888;font-size:12px">Si no podés asistir, ingresá a la plataforma y cancelá tu turno con anticipación.</p>
    </div>`

  await Promise.all([
    getResend().emails.send({
      from: FROM,
      to: patientEmail,
      subject: `Turno confirmado — ${date} ${hour}–${hEnd}`,
      html,
    }),
    getResend().emails.send({
      from: FROM,
      to: psicEmail,
      subject: `Nuevo turno — ${date} ${hour}–${hEnd}`,
      html: html.replace(
        `Hola <strong>${patientName}</strong>`,
        `Hola <strong>${psicName}</strong>, tenés un nuevo turno con <strong>${patientName}</strong>`
      ),
    }),
  ])
}

export async function sendBookingCancellation({
  patientEmail, patientName,
  psicEmail, psicName,
  date, hour,
}: {
  patientEmail: string; patientName: string
  psicEmail: string;    psicName: string
  date: string; hour: string
}) {
  const hEnd = `${String(parseInt(hour) + 1).padStart(2, '0')}:00`
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#E24B4A">Turno cancelado — Parcuve Sin Fronteras</h2>
      <p>El turno del <strong>${date}</strong> de <strong>${hour}–${hEnd}</strong> fue cancelado.</p>
    </div>`

  await Promise.all([
    getResend().emails.send({ from: FROM, to: patientEmail, subject: `Turno cancelado — ${date}`, html }),
    getResend().emails.send({ from: FROM, to: psicEmail,    subject: `Turno cancelado — ${date}`, html }),
  ])
}
