import { useEffect, useRef } from 'react'
import { attendanceRecords, type DayRecord } from '../../data/attendance'
import { TODAY, addDays, fmtLong, fmtMonthShort, iso, parse, startOfWeek } from '../../lib/date'

const statusText: Record<string, string> = {
  present: 'Present',
  late: 'Late arrival',
  half: 'Half day',
  absent: 'Absent',
  holiday: 'Holiday',
  break: 'No school',
}

export const statusLabel = (s: string) => statusText[s] ?? s

/**
 * Calendar heatmap: one column per week, Mon–Fri rows. Each school day is a
 * button so the record can be inspected by keyboard or touch. Status is
 * encoded by colour and pattern, and spelled out in the accessible name.
 */
export function AttendanceHeatmap({ selected, onSelect, from = '2026-04-01' }: { selected?: string; onSelect: (r: DayRecord) => void; from?: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  const byDate = new Map(attendanceRecords.map((r) => [r.date, r]))
  const start = startOfWeek(parse(from))
  const weeks: Date[][] = []
  for (let w = new Date(start); w <= TODAY; w = addDays(w, 7)) weeks.push(Array.from({ length: 5 }, (_, i) => addDays(w, i)))

  useEffect(() => {
    // Most recent weeks matter most — start scrolled to the end on small screens.
    scroller.current?.scrollTo({ left: scroller.current.scrollWidth })
  }, [])

  let lastMonth = -1
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div className="heat-days" aria-hidden style={{ gridTemplateRows: '14px repeat(5, 14px)' }}>
          <span />
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
        </div>
        <div ref={scroller} className="heatmap" role="group" aria-label="Attendance calendar, April to October. Select a day for details.">
          {weeks.map((days) => {
            const m = days[0].getMonth()
            const showMonth = m !== lastMonth
            lastMonth = m
            return (
              <div key={iso(days[0])} className="heat-col" style={{ gridTemplateRows: '14px repeat(5, 14px)' }}>
                <span className="heat-month" aria-hidden>
                  {showMonth ? fmtMonthShort(days[0]) : ''}
                </span>
                {days.map((d) => {
                  const key = iso(d)
                  const r = byDate.get(key)
                  if (d > TODAY) return <span key={key} className="heat-cell" data-v="none" />
                  if (!r)
                    return <span key={key} className="heat-cell" data-v="holiday" title={`${fmtLong(d)}: no school`} aria-hidden />
                  return (
                    <button key={key} className="heat-cell" data-v={r.status} aria-pressed={selected === key} aria-label={`${fmtLong(d)}: ${statusLabel(r.status)}${r.note ? `, ${r.note}` : ''}`} title={`${fmtLong(d)} — ${statusLabel(r.status)}`} onClick={() => onSelect(r)} />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span>
          <i className="heat-cell" data-v="present" /> Present
        </span>
        <span>
          <i className="heat-cell" data-v="late" /> Late
        </span>
        <span>
          <i className="heat-cell" data-v="half" /> Half day
        </span>
        <span>
          <i className="heat-cell" data-v="absent" /> Absent
        </span>
        <span>
          <i className="heat-cell" data-v="holiday" /> No school
        </span>
      </div>
    </div>
  )
}
