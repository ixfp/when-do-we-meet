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
}

type Recommendation = {
  date: string
  attendees: string[]
}

type AlgorithmSettings = {
  minDatesPerPerson: number
  minMeetingDates: number
  minMeetingsPerPerson: number
  minParticipantsPerMeeting: number
}

type MemberWithMonthlyDates = Member & {
  monthlyDates: string[]
}

type ParticipantSummary = {
  name: string
  dates: string[]
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

const defaultAlgorithmSettings: AlgorithmSettings = {
  minDatesPerPerson: 1,
  minMeetingDates: 1,
  minMeetingsPerPerson: 0,
  minParticipantsPerMeeting: 2,
}

const sanitizeAlgorithmSettings = (settings: AlgorithmSettings): AlgorithmSettings => ({
  minDatesPerPerson: Math.max(1, Math.floor(settings.minDatesPerPerson || 0)),
  minMeetingDates: Math.max(1, Math.floor(settings.minMeetingDates || 0)),
  minMeetingsPerPerson: Math.max(0, Math.floor(settings.minMeetingsPerPerson || 0)),
  minParticipantsPerMeeting: Math.max(1, Math.floor(settings.minParticipantsPerMeeting || 0)),
})

const getParticipantMeetingCounts = (
  selectedDates: string[],
  participants: ParticipantSummary[],
) => {
  return participants.map((participant) => {
    const count = selectedDates.filter((date) => participant.dates.includes(date)).length
    return { name: participant.name, count }
  })
}

const extendDatesToMeetMinimum = (
  currentDates: string[],
  orderedCandidates: string[],
  participants: ParticipantSummary[],
  minMeetingsPerPerson: number,
) => {
  if (minMeetingsPerPerson <= 0) {
    return currentDates
  }
  const maxAttempts = Math.min(orderedCandidates.length, 20)
  let bestDates = [...currentDates]

  for (let i = currentDates.length; i < maxAttempts; i++) {
    const candidate = orderedCandidates[i]
    if (!candidate) break
    if (currentDates.includes(candidate)) continue

    const testDates = [...currentDates, candidate]
    const counts = getParticipantMeetingCounts(testDates, participants)
    const allSatisfied = counts.every((participant) => participant.count >= minMeetingsPerPerson)
    if (allSatisfied) {
      return testDates
    }

    const currentUnsatisfied = getParticipantMeetingCounts(bestDates, participants).filter(
      (participant) => participant.count < minMeetingsPerPerson,
    ).length
    const newUnsatisfied = counts.filter(
      (participant) => participant.count < minMeetingsPerPerson,
    ).length

    if (newUnsatisfied < currentUnsatisfied) {
      bestDates = testDates
    }
  }

  return bestDates
}

function App() {
  const [members, setMembers] = usePersistentState<Member[]>('wdwm-members', [])
  const [settings, setSettings] = usePersistentState<Settings>('wdwm-settings', {
    month: todayMonth,
  })
  const [algorithmSettingsState, setAlgorithmSettingsState] = usePersistentState<AlgorithmSettings>(
    'wdwm-algorithm-settings',
    defaultAlgorithmSettings,
  )
  const algorithmSettings = useMemo(
    () => sanitizeAlgorithmSettings(algorithmSettingsState),
    [algorithmSettingsState],
  )
  const [isAlgorithmPanelOpen, setAlgorithmPanelOpen] = useState(false)
  const [algorithmDraft, setAlgorithmDraft] = useState(algorithmSettings)
  const [memberForm, setMemberForm] = useState({ name: '', requiredMonthly: 4 })
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)

  useEffect(() => {
    setAlgorithmDraft(algorithmSettings)
  }, [algorithmSettings])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isAlgorithmPanelOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAlgorithmPanelOpen])

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

  const targetMeetings = Math.max(1, algorithmSettings.minMeetingDates)
  const monthDate = useMemo(() => parseMonth(settings.month), [settings.month])
  const monthlyMembers = useMemo<MemberWithMonthlyDates[]>(() => {
    return members.map((member) => {
      const monthlyDates = member.availableDates.filter((date) =>
        isSameMonth(parseISO(date), monthDate),
      )
      return { ...member, monthlyDates }
    })
  }, [members, monthDate])
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [monthDate])

  const availabilityMap = useMemo(() => {
    const map = new Map<string, string[]>()
    monthlyMembers.forEach((member) => {
      member.monthlyDates.forEach((date) => {
        const existing = map.get(date) ?? []
        map.set(date, [...existing, member.name])
      })
    })
    return map
  }, [monthlyMembers])

  const prioritizedDates = useMemo<Recommendation[]>(() => {
    return Array.from(availabilityMap.entries())
      .map(([date, attendees]) => ({ date, attendees }))
      .sort((a, b) => {
        const diff = b.attendees.length - a.attendees.length
        if (diff !== 0) return diff
        return compareAsc(parseISO(a.date), parseISO(b.date))
      })
  }, [availabilityMap])

  const validRecommendations = useMemo(
    () =>
      prioritizedDates.filter(
        (item) => item.attendees.length >= algorithmSettings.minParticipantsPerMeeting,
      ),
    [prioritizedDates, algorithmSettings.minParticipantsPerMeeting],
  )

  const algorithmParticipants = useMemo<ParticipantSummary[]>(
    () =>
      monthlyMembers.map((member) => ({
        name: member.name,
        dates: member.monthlyDates,
      })),
    [monthlyMembers],
  )

  const algorithmResult = useMemo(() => {
    if (members.length === 0) {
      return { recommended: [] as Recommendation[], warnings: [] as string[] }
    }

    const warnings: string[] = []

    if (validRecommendations.length === 0) {
      warnings.push(
        `최소 ${algorithmSettings.minParticipantsPerMeeting}명 이상 참석 가능한 날짜가 없습니다.`,
      )
      return { recommended: [] as Recommendation[], warnings }
    }

    const candidateDates = validRecommendations.map((item) => item.date)
    let selectedDates = candidateDates.slice(0, targetMeetings)

    if (selectedDates.length < targetMeetings) {
      warnings.push(
        `최소 ${targetMeetings}회의 모임 날짜가 필요하지만 ${selectedDates.length}개만 확보되었습니다.`,
      )
    }

    if (
      algorithmSettings.minMeetingsPerPerson > 0 &&
      selectedDates.length > 0 &&
      algorithmParticipants.length > 0
    ) {
      const counts = getParticipantMeetingCounts(selectedDates, algorithmParticipants)
      const insufficient = counts.filter(
        (participant) => participant.count < algorithmSettings.minMeetingsPerPerson,
      )

      if (insufficient.length > 0) {
        const extended = extendDatesToMeetMinimum(
          selectedDates,
          candidateDates,
          algorithmParticipants,
          algorithmSettings.minMeetingsPerPerson,
        )
        selectedDates = extended

        const recheck = getParticipantMeetingCounts(selectedDates, algorithmParticipants)
        const stillInsufficient = recheck.filter(
          (participant) => participant.count < algorithmSettings.minMeetingsPerPerson,
        )

        if (stillInsufficient.length > 0) {
          warnings.push(
            `다음 팀원이 최소 ${algorithmSettings.minMeetingsPerPerson}회 참석 조건을 만족하지 못합니다: ${stillInsufficient
              .map((participant) => `${participant.name}(${participant.count}회)`)
              .join(', ')}`,
          )
        }
      }
    }

    const uniqueSelected = Array.from(new Set(selectedDates))
    const recommendedDates = uniqueSelected.map((date) => ({
      date,
      attendees: availabilityMap.get(date) ?? [],
    }))

    return { recommended: recommendedDates, warnings }
  }, [
    algorithmParticipants,
    algorithmSettings,
    availabilityMap,
    members.length,
    targetMeetings,
    validRecommendations,
  ])

  const recommended = algorithmResult.recommended

  const recommendedSet = useMemo(
    () => new Set(recommended.map((item) => item.date)),
    [recommended],
  )

  const memberMonthStats = useMemo(() => {
    return monthlyMembers.map((member) => {
      const matched = member.monthlyDates.filter((date) => recommendedSet.has(date)).length
      return {
        member,
        availableCount: member.monthlyDates.length,
        matched,
      }
    })
  }, [monthlyMembers, recommendedSet])

  const unmetMembers = memberMonthStats.filter(
    ({ member, availableCount }) => availableCount < member.requiredMonthly,
  )

  const insufficientPickMembers = memberMonthStats.filter(
    ({ availableCount }) => availableCount < algorithmSettings.minDatesPerPerson,
  )

  const shortageReasons: string[] = []
  if (members.length === 0) {
    shortageReasons.push('팀원을 추가하면 매칭을 시작할 수 있어요.')
  }
  if (unmetMembers.length > 0) {
    unmetMembers.forEach(({ member, availableCount }) => {
      shortageReasons.push(
        `${member.name}님의 가능 날짜가 ${member.requiredMonthly}회가 필요하지만 ${availableCount}회만 입력되었습니다.`,
      )
    })
  }
  if (insufficientPickMembers.length > 0) {
    insufficientPickMembers.forEach(({ member, availableCount }) => {
      shortageReasons.push(
        `${member.name}님은 최소 ${algorithmSettings.minDatesPerPerson}개의 날짜를 선택해야 합니다. (현재 ${availableCount}개)`,
      )
    })
  }
  shortageReasons.push(...algorithmResult.warnings)

  const handleAlgorithmPanelOpen = () => {
    setAlgorithmDraft(algorithmSettings)
    setAlgorithmPanelOpen(true)
  }

  const handleAlgorithmInputChange = (field: keyof AlgorithmSettings, value: number) => {
    setAlgorithmDraft((prev) => {
      const numericValue = Number.isFinite(value) ? Math.floor(value) : prev[field]
      const safeValue =
        field === 'minMeetingsPerPerson' ? Math.max(0, numericValue) : Math.max(1, numericValue)
      return { ...prev, [field]: safeValue }
    })
  }

  const handleAlgorithmReset = () => {
    setAlgorithmDraft(defaultAlgorithmSettings)
    setAlgorithmSettingsState(defaultAlgorithmSettings)
  }

  const handleAlgorithmCancel = () => {
    setAlgorithmDraft(algorithmSettings)
    setAlgorithmPanelOpen(false)
  }

  const handleAlgorithmSave = () => {
    setAlgorithmSettingsState(sanitizeAlgorithmSettings(algorithmDraft))
    setAlgorithmPanelOpen(false)
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
    <>
      <main className="page">
        <header className="hero">
          <p className="eyebrow">우리 언제 만나? · When Do We Meet</p>
          <h1>간단 입력 → 자동 매칭 → 달력에서 확인</h1>
          <p className="subcopy">
            팀원의 가용 날짜와 알고리즘 조건을 입력하면, 가장 많은 사람이 모일 수 있는 날짜 조합을 추천해드려요.
          </p>
        </header>

        <section className="panel settings">
          <div className="panel-header panel-header-with-button">
            <div>
              <h2>기준 정보</h2>
              <span>기준 월을 변경하고 알고리즘 조건을 조정해 최적의 일정을 찾아보세요.</span>
            </div>
            <button type="button" className="secondary" onClick={handleAlgorithmPanelOpen}>
              설정 열기
            </button>
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
            <div className="stat-box">
              <span>추천 결과</span>
              <strong>
                {recommended.length}/{targetMeetings}회
              </strong>
              <small>
                {format(monthDate, 'M월', { locale: ko })} · 최소 {targetMeetings}회 목표
              </small>
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
                {recommended.length}/{targetMeetings}회
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
      {isAlgorithmPanelOpen && (
      <div className="algorithm-overlay" role="dialog" aria-modal="true">
        <div className="overlay-backdrop" onClick={handleAlgorithmCancel} />
        <section className="panel algorithm-panel">
          <div className="panel-header">
            <h2>모임 날짜 결정 알고리즘 설정</h2>
            <span>조건을 조정하면 추천 결과가 즉시 반영됩니다.</span>
          </div>
          <div className="algorithm-grid">
            <label>
              인당 최소 선택 날짜 수
              <input
                type="number"
                min={1}
                value={algorithmDraft.minDatesPerPerson}
                onChange={(event) =>
                  handleAlgorithmInputChange('minDatesPerPerson', Number(event.target.value))
                }
              />
              <span className="field-hint">각 참가자가 최소한 선택해야 하는 날짜 수</span>
            </label>
            <label>
              최소 모임 횟수
              <input
                type="number"
                min={1}
                value={algorithmDraft.minMeetingDates}
                onChange={(event) =>
                  handleAlgorithmInputChange('minMeetingDates', Number(event.target.value))
                }
              />
              <span className="field-hint">최종적으로 정해질 모임 날짜의 최소 개수</span>
            </label>
            <label>
              인당 최소 참석 모임 횟수
              <input
                type="number"
                min={0}
                value={algorithmDraft.minMeetingsPerPerson}
                onChange={(event) =>
                  handleAlgorithmInputChange('minMeetingsPerPerson', Number(event.target.value))
                }
              />
              <span className="field-hint">각 참가자가 참석해야 하는 모임 횟수 (0 = 제한 없음)</span>
            </label>
            <label>
              모임당 최소 참석 인원
              <input
                type="number"
                min={1}
                value={algorithmDraft.minParticipantsPerMeeting}
                onChange={(event) =>
                  handleAlgorithmInputChange('minParticipantsPerMeeting', Number(event.target.value))
                }
              />
              <span className="field-hint">한 모임 날짜에 최소한 필요한 참석 인원</span>
            </label>
          </div>
          <div className="algorithm-actions">
            <button type="button" className="primary" onClick={handleAlgorithmSave}>
              저장
            </button>
            <button type="button" className="warn" onClick={handleAlgorithmReset}>
              초기화
            </button>
            <button type="button" className="ghost" onClick={handleAlgorithmCancel}>
              취소
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  )
}

export default App
