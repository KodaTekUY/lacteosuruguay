function pad2(value: number): string {
  return value.toString().padStart(2, "0")
}

export function toDateTimeLocalInputValue(value: string | Date | null | undefined): string {
  if (!value) return ""

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
