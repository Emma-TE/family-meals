export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() || 7 // treat Sunday as 7 so the week starts Monday
  d.setDate(d.getDate() - day + 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayNum}`
}
