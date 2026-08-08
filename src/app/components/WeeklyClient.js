'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { stitchTheme } from '../styles/stitchTheme'
import { getWeekStart } from '../../lib/week'
import { useWindowWidth } from '../hooks/useWindowWidth'
import PageShell from './PageShell'
import MealDetailModal from './MealDetailModal'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner']

const DAY_ICONS = {
  monday: '🌙',
  tuesday: '🔥',
  wednesday: '💧',
  thursday: '🌳',
  friday: '⭐',
  saturday: '🎉',
  sunday: '☀️',
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const getMealTimeIcon = (time) => {
  switch (time) {
    case 'breakfast': return '🍳'
    case 'lunch': return '🥘'
    case 'dinner': return '🍲'
    default: return '🍽️'
  }
}

const getMealTimeBg = (time) => {
  switch (time) {
    case 'breakfast': return `${stitchTheme.colors.secondary}10`
    case 'lunch': return `${stitchTheme.colors.tertiary}10`
    case 'dinner': return `${stitchTheme.colors.primary}10`
    default: return stitchTheme.colors.surfaceContainerLow
  }
}

export default function WeeklyClient({ user, userRole, initialMeals, initialPlans }) {
  const supabase = createClient()
  const width = useWindowWidth()
  const isMobile = width < 768

  const [meals, setMeals] = useState(initialMeals)
  const [currentWeek] = useState(() => getWeekStart())
  const [weeklyPlan, setWeeklyPlan] = useState(() =>
    initialPlans.find((p) => p.week_start === getWeekStart()) || null
  )
  const [generating, setGenerating] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [hoveredMeal, setHoveredMeal] = useState(null)

  async function generateNewWeek() {
    if (userRole !== 'admin' || generating) return

    setGenerating(true)

    try {
      const breakfastMeals = meals.filter((m) => m.category === 'breakfast')
      const lunchMeals = meals.filter((m) => m.category === 'lunch')
      const dinnerMeals = meals.filter((m) => m.category === 'dinner')

      if (breakfastMeals.length === 0 || lunchMeals.length === 0 || dinnerMeals.length === 0) {
        alert('Please add at least one breakfast, lunch, and dinner meal first.')
        return
      }

      const { data: existingPlan } = await supabase
        .from('weekly_plans')
        .select('id')
        .eq('week_start', currentWeek)
        .maybeSingle()

      if (existingPlan) {
        const confirmed = window.confirm('A plan already exists for this week. Do you want to replace it?')
        if (!confirmed) return
      }

      const shuffledBreakfast = shuffle(breakfastMeals)
      const shuffledLunch = shuffle(lunchMeals)
      const shuffledDinner = shuffle(dinnerMeals)

      const newPlan = { week_start: currentWeek }
      DAYS.forEach((day, index) => {
        newPlan[`${day}_breakfast`] = shuffledBreakfast[index % shuffledBreakfast.length]?.id
        newPlan[`${day}_lunch`] = shuffledLunch[index % shuffledLunch.length]?.id
        newPlan[`${day}_dinner`] = shuffledDinner[index % shuffledDinner.length]?.id
      })

      const { data, error } = await supabase
        .from('weekly_plans')
        .upsert([newPlan], { onConflict: 'week_start' })
        .select()

      if (error) {
        console.error('Insert error details:', error)
        alert('Error generating week: ' + error.message)
      } else {
        setWeeklyPlan(data[0])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const getMealById = (id) => meals.find((m) => m.id === id)

  const formatDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1)

  return (
    <PageShell title="📅 Weekly Plan" active="planner" user={user} userRole={userRole}>
      {/* Week Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '32px',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: stitchTheme.colors.surface,
            padding: '24px',
            borderRadius: '16px',
            boxShadow: stitchTheme.shadows.md,
            border: `1px solid ${stitchTheme.colors.outlineVariant}`,
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                width: '50px',
                height: '50px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
              }}
            >
              📅
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: stitchTheme.colors.onSurfaceVariant,
                  marginBottom: '4px',
                }}
              >
                Current Week
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? '18px' : '24px',
                  color: stitchTheme.colors.onSurface,
                  fontWeight: 600,
                }}
              >
                {new Date(currentWeek).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={generateNewWeek}
            disabled={generating}
            style={{
              background: generating ? '#ccc' : `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '9999px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: stitchTheme.shadows.md,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!generating) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = stitchTheme.shadows.glow
              }
            }}
            onMouseLeave={(e) => {
              if (!generating) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = stitchTheme.shadows.md
              }
            }}
          >
            <span>{generating ? '⏳' : '🔄'}</span>
            {generating ? 'Generating...' : 'Generate New Week'}
          </button>
        )}
      </div>

      {/* Weekly Grid */}
      {!weeklyPlan ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            background: stitchTheme.colors.surfaceContainerLow,
            borderRadius: '24px',
            border: `2px dashed ${stitchTheme.colors.outlineVariant}`,
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📅</div>
          <h3 style={{ color: stitchTheme.colors.onSurface, marginBottom: '8px' }}>
            No meal plan for this week
          </h3>
          <p style={{ color: stitchTheme.colors.onSurfaceVariant, marginBottom: '24px' }}>
            {userRole === 'admin'
              ? 'Click "Generate New Week" to create your first weekly meal plan!'
              : "Your admin hasn't generated a meal plan for this week yet."}
          </p>
          {userRole === 'admin' && (
            <button
              onClick={generateNewWeek}
              disabled={generating}
              style={{
                background: generating ? '#ccc' : `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '9999px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {generating ? 'Generating...' : '✨ Generate First Week'}
            </button>
          )}
        </div>
      ) : (
        <>
          {isMobile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                color: stitchTheme.colors.onSurfaceVariant,
                fontSize: '12px',
              }}
            >
              <span>← Swipe to see more days</span>
              <span>7 days →</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '20px',
              padding: '4px 0 32px 0',
              scrollSnapType: isMobile ? 'x mandatory' : 'none',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: `${stitchTheme.colors.primary} ${stitchTheme.colors.outlineVariant}`,
            }}
          >
            {DAYS.map((day, dayIndex) => {
              const isHovered = hoveredDay === day
              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    minWidth: isMobile ? '85%' : 'calc(14.28% - 17px)',
                    scrollSnapAlign: isMobile ? 'start' : 'none',
                    background: stitchTheme.colors.surface,
                    border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: isHovered ? stitchTheme.shadows.lg : stitchTheme.shadows.md,
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    animation: `slideUp 0.4s ease-out ${dayIndex * 0.05}s both`,
                  }}
                >
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                      padding: '16px',
                      textAlign: 'center',
                      color: 'white',
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                      {DAY_ICONS[day]}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {formatDayName(day)}
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    {MEAL_TIMES.map((time) => {
                      const mealId = weeklyPlan[`${day}_${time}`]
                      const meal = getMealById(mealId)
                      const isMealHovered = hoveredMeal === `${day}-${time}`

                      return (
                        <div
                          key={time}
                          onMouseEnter={() => setHoveredMeal(`${day}-${time}`)}
                          onMouseLeave={() => setHoveredMeal(null)}
                          onClick={() => {
                            if (meal) {
                              setSelectedMeal(meal)
                              setIsMealModalOpen(true)
                            }
                          }}
                          style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: getMealTimeBg(time),
                            borderRadius: '12px',
                            cursor: meal ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            opacity: meal ? 1 : 0.5,
                            transform: isMealHovered && meal ? 'scale(1.02)' : 'scale(1)',
                            border: isMealHovered && meal
                              ? `2px solid ${stitchTheme.colors.primary}`
                              : '2px solid transparent',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                color: stitchTheme.colors.primary,
                                background: 'rgba(255,255,255,0.5)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              {getMealTimeIcon(time)} {time}
                            </span>
                            {meal && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: stitchTheme.colors.onSurfaceVariant,
                                }}
                              >
                                🔥 {meal.calories} kcal
                              </span>
                            )}
                          </div>

                          {meal ? (
                            <>
                              <img
                                src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'}
                                alt={meal.name}
                                style={{
                                  width: '100%',
                                  height: isMobile ? '80px' : '70px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  marginBottom: '8px',
                                }}
                              />
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: isMobile ? '13px' : '12px',
                                  color: stitchTheme.colors.onSurface,
                                  marginBottom: '4px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {meal.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: stitchTheme.colors.onSurfaceVariant,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {meal.portion}
                              </div>
                              <div
                                style={{
                                  marginTop: '8px',
                                  fontSize: '10px',
                                  color: stitchTheme.colors.primary,
                                  textAlign: 'right',
                                  opacity: isMealHovered ? 1 : 0.6,
                                }}
                              >
                                Tap for details →
                              </div>
                            </>
                          ) : (
                            <div
                              style={{
                                height: isMobile ? '100px' : '90px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.5)',
                                borderRadius: '8px',
                                color: stitchTheme.colors.onSurfaceVariant,
                                fontSize: '12px',
                              }}
                            >
                              No meal assigned
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Weekly Summary */}
      {weeklyPlan && (
        <div
          style={{
            marginTop: '32px',
            background: stitchTheme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${stitchTheme.colors.outlineVariant}`,
            boxShadow: stitchTheme.shadows.sm,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              color: stitchTheme.colors.onSurface,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📊</span> Week Summary
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[
              { label: 'Breakfast', icon: '🍳', color: stitchTheme.colors.secondary, key: 'breakfast' },
              { label: 'Lunch', icon: '🥘', color: stitchTheme.colors.tertiary, key: 'lunch' },
              { label: 'Dinner', icon: '🍲', color: stitchTheme.colors.primary, key: 'dinner' },
            ].map(({ label, icon, color, key }) => (
              <div key={key} style={{ background: `${color}10`, padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color, marginBottom: '4px' }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color }}>
                  {DAYS.filter((day) => weeklyPlan[`${day}_${key}`]).length}/7
                </div>
                <div style={{ fontSize: '11px', color }}>meals planned</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MealDetailModal
        meal={selectedMeal}
        isOpen={isMealModalOpen}
        onClose={() => {
          setIsMealModalOpen(false)
          setSelectedMeal(null)
        }}
      />
    </PageShell>
  )
}
