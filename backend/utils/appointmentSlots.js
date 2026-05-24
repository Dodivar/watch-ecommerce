const HALF_DAY_HOUR = 12

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isBusinessDay(date) {
  const day = date.getDay()
  return day >= 1 && day <= 6
}

function parseDateISO(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getNextBusinessDay(fromDate) {
  const d = startOfDay(fromDate)
  d.setDate(d.getDate() + 1)
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

function getMinAppointmentDate(now = new Date()) {
  const today = startOfDay(now)
  if (!isBusinessDay(today)) {
    return getNextBusinessDay(today)
  }
  if (now.getHours() < HALF_DAY_HOUR) {
    return today
  }
  return getNextBusinessDay(today)
}

function isAppointmentDateEligible(dateStr, now = new Date()) {
  if (!dateStr?.trim()) return false
  const date = parseDateISO(dateStr)
  if (Number.isNaN(date.getTime())) return false
  if (!isBusinessDay(date)) return false
  const minDate = getMinAppointmentDate(now)
  return date >= minDate
}

function getAvailableAppointmentSlots(dateStr, now = new Date()) {
  if (!dateStr?.trim()) return []
  const date = parseDateISO(dateStr)
  if (Number.isNaN(date.getTime()) || !isBusinessDay(date)) return []

  const today = startOfDay(now)
  const isToday = isSameDay(date, today)

  if (isToday && now.getHours() < HALF_DAY_HOUR) {
    return ['afternoon']
  }

  if (isToday) {
    return []
  }

  return ['morning', 'afternoon']
}

function validateAppointmentSubmission({ date, time_slot }, now = new Date()) {
  if (!['morning', 'afternoon'].includes(time_slot)) {
    return { valid: false, message: 'Créneau invalide.' }
  }
  if (!isAppointmentDateEligible(date, now)) {
    return { valid: false, message: 'Date non disponible.' }
  }
  const slots = getAvailableAppointmentSlots(date, now)
  if (!slots.includes(time_slot)) {
    return { valid: false, message: 'Créneau non disponible pour cette date.' }
  }
  return { valid: true }
}

module.exports = {
  validateAppointmentSubmission,
  getAvailableAppointmentSlots,
  isAppointmentDateEligible,
}
