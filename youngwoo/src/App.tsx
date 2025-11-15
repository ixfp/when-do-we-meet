import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  compareAsc,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import './App.css'

type Member = {
  id: string
  name: string
  requiredMonthly: number
  availableDates: string[]
}

type Settings = {
  month: string
  monthlyTarget: number
}

type Recommendation = {
  date: string
  attendees: string[]
}

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
const todayMonth = format(new Date(), 'yyyy-MM')

const safeId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    const stored = window.localStorage.getItem(key)
    if (!stored) {
      return initialValue
    }

    try {
      return JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  const setAndPersist = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = value instanceof Function ? value(prev) : value
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(next))
      }
      return next
    })
  }

  return [state, setAndPersist] as const
}

const parseMonth = (month: string) => {
  const [year, monthPart] = month?.split('-') ?? []
  const numericYear = Number(year)
  const numericMonth = Number(monthPart) - 1
  if (Number.isNaN(numericYear) || Number.isNaN(numericMonth)) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return new Date(numericYear, numericMonth, 1)
}

const formatDisplayDate = (date: string) =>
  format(parseISO(date), 'M월 d일 (EEE)', { locale: ko })

function App() {
  const [members, setMembers] = usePersistentState<Member[]>('wdwm-members', [])
  const [settings, setSettings] = usePersistentState<Settings>('wdwm-settings', {
    month: todayMonth,
    monthlyTarget: 8,
  })
  const [memberForm, setMemberForm] = useState({ name: '', requiredMonthly: 4 })
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (members.length === 0) {
      if (activeMemberId !== null) {
        setActiveMemberId(null)
      }
      return
    }
    const exists = members.some((member) => member.id === activeMemberId)
    if (!exists) {
      setActiveMemberId(members[0].id)
    }
  }, [members, activeMemberId])

  const targetMeetings = Math.max(0, settings.monthlyTarget)
  const monthDate = useMemo(() => parseMonth(settings.month), [settings.month])
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [monthDate])

  const availabilityMap = useMemo(() => {
    const map = new Map<string, string[]>()
    members.forEach((member) => {
      member.availableDates.forEach((date) => {
        if (!isSameMonth(parseISO(date), monthDate)) return
        const existing = map.get(date) ?? []
        map.set(date, [...existing, member.name])
      })
    })
    return map
  }, [members, monthDate])

  const prioritizedDates = useMemo<Recommendation[]>(() => {
    return Array.from(availabilityMap.entries())
      .map(([date, attendees]) => ({ date, attendees }))
      .sort((a, b) => {
        const diff = b.attendees.length - a.attendees.length
        if (diff !== 0) return diff
        return compareAsc(parseISO(a.date), parseISO(b.date))
      })
  }, [availabilityMap])

  const recommended = useMemo(() => {
    if (targetMeetings === 0) return []
    return prioritizedDates.slice(0, targetMeetings)
  }, [prioritizedDates, targetMeetings])

  const recommendedSet = useMemo(
    () => new Set(recommended.map((item) => item.date)),
    [recommended],
  )

  const memberMonthStats = useMemo(() => {
    return members.map((member) => {
      const monthlyDates = member.availableDates.filter((date) =>
        isSameMonth(parseISO(date), monthDate),
      )
      const matched = monthlyDates.filter((date) => recommendedSet.has(date)).length
      return {
        member,
        availableCount: monthlyDates.length,
        matched,
      }
    })
  }, [members, monthDate, recommendedSet])

  const unmetMembers = memberMonthStats.filter(
    ({ member, availableCount }) => availableCount < member.requiredMonthly,
  )

  const shortageReasons: string[] = []
  if (unmetMembers.length > 0) {
    unmetMembers.forEach(({ member, availableCount }) => {
      shortageReasons.push(
        `${member.name}님의 가능 날짜가 ${member.requiredMonthly}회가 필요하지만 ${availableCount}회만 입력되었습니다.`,
      )
    })
  }
  if (targetMeetings > 0 && recommended.length < targetMeetings) {
    shortageReasons.push(
      `목표 ${targetMeetings}회 중 ${recommended.length}회만 추천되었습니다. 가용 날짜를 더 추가해주세요.`,
    )
  }
  if (members.length === 0) {
    shortageReasons.push('팀원을 추가하면 매칭을 시작할 수 있어요.')
  }

  const handleAddMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!memberForm.name.trim()) return
    const newId = safeId()
    setMembers((prev) => [
      ...prev,
      {
        id: newId,
        name: memberForm.name.trim(),
        requiredMonthly: Math.max(1, memberForm.requiredMonthly),
        availableDates: [],
      },
    ])
    setActiveMemberId(newId)
    setMemberForm({ name: '', requiredMonthly: memberForm.requiredMonthly })
  }

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
    setActiveMemberId((prev) => (prev === id ? null : prev))
  }

  const handleRemoveDate = (memberId: string, date: string) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              availableDates: member.availableDates.filter((d) => d !== date),
            }
          : member,
      ),
    )
  }

  const handleRequiredChange = (memberId: string, value: number) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, requiredMonthly: Math.max(1, value) }
          : member,
      ),
    )
  }

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeMemberId) ?? null,
    [members, activeMemberId],
  )

  const handleToggleAvailability = (isoDate: string) => {
    if (!activeMemberId) return
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== activeMemberId) return member
        const exists = member.availableDates.includes(isoDate)
        const nextDates = exists
          ? member.availableDates.filter((date) => date !== isoDate)
          : Array.from(new Set([...member.availableDates, isoDate])).sort()
        return {
          ...member,
          availableDates: nextDates,
        }
      }),
    )
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">우리 언제 만나? · When Do We Meet</p>
        <h1>간단 입력 → 자동 매칭 → 달력에서 확인</h1>
        <p className="subcopy">
          팀원의 가용 날짜와 목표 횟수를 입력하면, 가장 많은 사람이 모일 수 있는 날짜 조합을 추천해드려요.
        </p>
      </header>

      <section className="panel settings">
        <div className="panel-header">
          <h2>기준 정보</h2>
          <span>월간 목표 횟수를 입력하면 추천 일정이 계산됩니다.</span>
        </div>
        <div className="settings-grid">
          <label>
            기준 월
            <input
              type="month"
              value={settings.month}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, month: event.target.value || todayMonth }))
              }
            />
          </label>
          <label>
            월 목표 만남 횟수
            <input
              type="number"
              min={0}
              max={31}
              value={settings.monthlyTarget}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  monthlyTarget: Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="stat-box">
            <span>추천 결과</span>
            <strong>
              {recommended.length}/{targetMeetings || 0}회
            </strong>
            <small>{format(monthDate, 'M월', { locale: ko })} 기준</small>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>팀 가용 정보</h2>
          <span>팀원이 가능한 날짜를 입력해 주세요.</span>
        </div>

        <form className="add-member" onSubmit={handleAddMember}>
          <input
            placeholder="이름"
            value={memberForm.name}
            onChange={(event) =>
              setMemberForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            type="number"
            min={1}
            max={12}
            value={memberForm.requiredMonthly}
            onChange={(event) =>
              setMemberForm((prev) => ({
                ...prev,
                requiredMonthly: Number(event.target.value),
              }))
            }
          />
          <button type="submit">팀원 추가</button>
        </form>

        <div className="member-list">
          {members.length === 0 && (
            <p className="empty-state">
              아직 팀원이 없습니다. 이름과 월별 최소 참석 횟수를 입력해 추가해보세요.
            </p>
          )}

          {members.map((member) => (
            <article
              key={member.id}
              className={`member-card ${activeMemberId === member.id ? 'selected' : ''}`}
            >
              <div className="member-header">
                <div>
                  <h3>{member.name}</h3>
                  <label className="inline-label">
                    월 최소 참석
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={member.requiredMonthly}
                      onChange={(event) =>
                        handleRequiredChange(member.id, Number(event.target.value))
                      }
                    />
                  </label>
                </div>
                <div className="member-actions">
                  <button
                    type="button"
                    className={`ghost ${activeMemberId === member.id ? 'active' : ''}`}
                    onClick={() => setActiveMemberId(member.id)}
                  >
                    {activeMemberId === member.id ? '선택됨' : '선택'}
                  </button>
                  <button className="ghost" type="button" onClick={() => handleRemoveMember(member.id)}>
                    삭제
                  </button>
                </div>
              </div>

              <p className="calendar-hint">
                달력에서 날짜를 클릭하면 {member.name}님의 참석 가능 여부가 토글됩니다.
              </p>
              <div className="chips">
                {member.availableDates.length === 0 && (
                  <span className="chip muted">등록된 날짜 없음</span>
                )}
                {member.availableDates.map((date) => (
                  <span key={date} className="chip">
                    {formatDisplayDate(date)}
                    <button
                      type="button"
                      aria-label={`${formatDisplayDate(date)} 삭제`}
                      onClick={() => handleRemoveDate(member.id, date)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel calendar-panel">
        <div className="panel-header">
          <h2>{format(monthDate, 'yyyy년 M월 달력', { locale: ko })}</h2>
          <span>
            팀원의 이름을 선택한 뒤, 달력에서 날짜를 클릭하면 참석 가능 여부가 토글됩니다. 추천 일정은
            파란색으로 강조돼요.
          </span>
        </div>
        <div className="calendar-toolbar">
          <div>
            <strong>현재 입력 대상</strong>
            <p>{activeMember?.name ?? '선택된 팀원이 없습니다.'}</p>
          </div>
          <div>
            <strong>추천 완료</strong>
            <p>
              {recommended.length}/{targetMeetings || 0}회
            </p>
          </div>
        </div>
        <div className="calendar">
          {weekdayLabels.map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
          {calendarDays.map((date) => {
            const iso = format(date, 'yyyy-MM-dd')
            const attendees = availabilityMap.get(iso) ?? []
            const isCurrentMonth = isSameMonth(date, monthDate)
            const isPrimary = recommendedSet.has(iso)
            const isSelectedByActive = Boolean(activeMember?.availableDates.includes(iso))
            const isEditable = isCurrentMonth && Boolean(activeMember)
            const handleClick = () => {
              if (!isEditable) return
              handleToggleAvailability(iso)
            }
            return (
              <button
                key={iso}
                type="button"
                onClick={handleClick}
                className={[
                  'day',
                  isCurrentMonth ? '' : 'muted',
                  isEditable ? 'editable' : '',
                  isPrimary ? 'primary' : '',
                  isSelectedByActive ? 'active-member' : '',
                ].join(' ')}
                aria-pressed={isSelectedByActive}
                disabled={!isEditable}
              >
                <span className="date-number">{format(date, 'd')}</span>
                {isPrimary && <span className="recommend-label">추천</span>}
                <div className="name-list">
                  {attendees.length === 0 && <span className="muted-text">미정</span>}
                  {attendees.map((name, index) => (
                    <span key={`${iso}-${name}-${index}`} className="name-pill">
                      {name}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
        {targetMeetings === 0 && (
          <p className="empty-state">월 목표 횟수를 0보다 크게 설정하면 추천 일정이 계산됩니다.</p>
        )}
        {shortageReasons.length > 0 && (
          <div className="alert">
            <strong>매칭 불가 / 주의 사항</strong>
            <ul>
              {shortageReasons.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
