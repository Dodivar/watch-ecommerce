import { computed, ref, watch } from 'vue'
import { formatWeekdayDate } from '@/utils/formatters.js'

export const HALF_DAY_HOUR = 12
export const SLOT_LABELS = {
  morning: 'Matin',
  afternoon: 'Après-midi',
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isBusinessDay(date) {
  const day = date.getDay()
  return day >= 1 && day <= 6
}

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateISO(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a, b) {
  return formatDateISO(a) === formatDateISO(b)
}

function getNextBusinessDay(fromDate) {
  const d = startOfDay(fromDate)
  d.setDate(d.getDate() + 1)
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

export function getMinAppointmentDate(now = new Date()) {
  const today = startOfDay(now)
  if (!isBusinessDay(today)) {
    return getNextBusinessDay(today)
  }
  if (now.getHours() < HALF_DAY_HOUR) {
    return today
  }
  return getNextBusinessDay(today)
}

export function isAppointmentDateEligible(dateStr, now = new Date()) {
  if (!dateStr?.trim()) return false
  const date = parseDateISO(dateStr)
  if (Number.isNaN(date.getTime())) return false
  if (!isBusinessDay(date)) return false
  const minDate = getMinAppointmentDate(now)
  return date >= minDate
}

export function getAvailableAppointmentSlots(dateStr, now = new Date()) {
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

export function formatAppointmentDateLabel(dateStr) {
  const date = parseDateISO(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return formatWeekdayDate(date)
}

export function useRetailAppointmentSlots(initialDate = '') {
  const selectedDate = ref(initialDate)

  const minDate = computed(() => formatDateISO(getMinAppointmentDate()))

  const availableSlots = computed(() => getAvailableAppointmentSlots(selectedDate.value))

  const slotOptions = computed(() =>
    availableSlots.value.map((value) => ({
      value,
      label: SLOT_LABELS[value],
    })),
  )

  watch(selectedDate, (date) => {
    if (!isAppointmentDateEligible(date)) {
      selectedDate.value = minDate.value
    }
  })

  return {
    selectedDate,
    minDate,
    availableSlots,
    slotOptions,
    isDateEligible: isAppointmentDateEligible,
    formatDateLabel: formatAppointmentDateLabel,
  }
}
