'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { stitchTheme, globalStyles } from '../styles/stitchTheme'
import UserMenu from '../components/UserMenu'

export default function WeeklyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [meals, setMeals] = useState([])
  const [currentWeek, setCurrentWeek] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [hoveredMeal, setHoveredMeal] = useState(null)

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const mealTimes = ['breakfast', 'lunch', 'dinner']

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    setUser(session.user)
    await fetchUserRole(session.user.id)
    await fetchMeals()
    await fetchWeeklyPlan()
    setLoading(false)
  }

  async function fetchUserRole(userId) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    setUserRole(data?.role || 'viewer')
  }

  async function fetchMeals() {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .order('category')
    setMeals(data || [])
  }

  async function fetchWeeklyPlan() {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() || 7) + 1)
    const weekStart = monday.toISOString().split('T')[0]
    setCurrentWeek(weekStart)

    const { data } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('week_start', weekStart)
      .single()

    setWeeklyPlan(data)
  }

  async function generateNewWeek() {
    if (userRole !== 'admin' || generating) return
    
    setGenerating(true)

    try {
      const { data: existingPlan, error: checkError } = await supabase
        .from('weekly_plans')
        .select('id')
        .eq('week_start', currentWeek)
        .maybeSingle()
      
      if (checkError) {
        console.error('Check error:', checkError)
        alert('Error checking existing plan: ' + checkError.message)
        setGenerating(false)
        return
      }
    
      if (existingPlan) {
        const confirm = window.confirm('A plan already exists for this week. Do you want to replace it?')
        if (!confirm) {
          setGenerating(false)
          return
        }
        
        const { error: deleteError } = await supabase
          .from('weekly_plans')
          .delete()
          .eq('week_start', currentWeek)
        
        if (deleteError) {
          console.error('Delete error:', deleteError)
          alert('Error deleting existing plan: ' + deleteError.message)
          setGenerating(false)
          return
        }
      }
    
      const breakfastMeals = meals.filter(m => m.category === 'breakfast')
      const lunchMeals = meals.filter(m => m.category === 'lunch')
      const dinnerMeals = meals.filter(m => m.category === 'dinner')
    
      if (breakfastMeals.length === 0 || lunchMeals.length === 0 || dinnerMeals.length === 0) {
        alert('Please add at least one breakfast, lunch, and dinner meal first.')
        setGenerating(false)
        return
      }
    
      const shuffle = (array) => array.sort(() => Math.random() - 0.5)
      
      const shuffledBreakfast = shuffle([...breakfastMeals])
      const shuffledLunch = shuffle([...lunchMeals])
      const shuffledDinner = shuffle([...dinnerMeals])
    
      const weekStart = currentWeek
      const newPlan = { week_start: weekStart }
    
      days.forEach((day, index) => {
        newPlan[`${day}_breakfast`] = shuffledBreakfast[index % shuffledBreakfast.length]?.id
        newPlan[`${day}_lunch`] = shuffledLunch[index % shuffledLunch.length]?.id
        newPlan[`${day}_dinner`] = shuffledDinner[index % shuffledDinner.length]?.id
      })
    
      const { data, error } = await supabase
        .from('weekly_plans')
        .insert([newPlan])
        .select()
    
      if (error) {
        console.error('Insert error details:', error)
        alert('Error generating week: ' + error.message)
      } else {
        alert('✅ New week generated!')
        fetchWeeklyPlan()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleMealClick = (meal) => {
    setSelectedMeal(meal)
    setIsMealModalOpen(true)
  }

  const getMealById = (id) => meals.find(m => m.id === id)

  const getDayIcon = (day) => {
    const icons = {
      monday: '🌙',
      tuesday: '🔥',
      wednesday: '💧',
      thursday: '🌳',
      friday: '⭐',
      saturday: '🎉',
      sunday: '☀️'
    }
    return icons[day] || '📅'
  }

  const formatDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

  const getMealTimeIcon = (time) => {
    switch(time) {
      case 'breakfast': return '🍳'
      case 'lunch': return '🥘'
      case 'dinner': return '🍲'
      default: return '🍽️'
    }
  }

  const getMealTimeBg = (time) => {
    switch(time) {
      case 'breakfast': return `${stitchTheme.colors.secondary}10`
      case 'lunch': return `${stitchTheme.colors.tertiary}10`
      case 'dinner': return `${stitchTheme.colors.primary}10`
      default: return stitchTheme.colors.surfaceContainerLow
    }
  }

  const isMobile = windowWidth < 768

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ 
          fontSize: '64px',
          animation: 'bounce 2s infinite'
        }}>📅</div>
        <div style={{ 
          fontSize: '18px',
          color: 'white',
          fontWeight: 500
        }}>Loading weekly plan...</div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: `3px solid white`,
          borderRadius: '9999px',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          ${globalStyles}
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: '100vh',
        background: stitchTheme.colors.background,
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        {/* Header - Clean Version */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `${stitchTheme.colors.surface}/0.8`,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${stitchTheme.colors.outlineVariant}`,
          padding: '16px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '22px' : '28px',
              background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}>
              📅 Weekly Plan
            </h1>
            
            <UserMenu user={user} userRole={userRole} />
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Week Header */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '32px',
            gap: '16px'
          }}>
            <div style={{
              background: stitchTheme.colors.surface,
              padding: '24px',
              borderRadius: '16px',
              boxShadow: stitchTheme.shadows.md,
              border: `1px solid ${stitchTheme.colors.outlineVariant}`,
              flex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                  width: '50px',
                  height: '50px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  📅
                </div>
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: stitchTheme.colors.onSurfaceVariant,
                    marginBottom: '4px'
                  }}>
                    Current Week
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: isMobile ? '18px' : '24px',
                    color: stitchTheme.colors.onSurface,
                    fontWeight: 600
                  }}>
                    {new Date(currentWeek).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
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
                  justifyContent: 'center'
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
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: stitchTheme.colors.surfaceContainerLow,
              borderRadius: '24px',
              border: `2px dashed ${stitchTheme.colors.outlineVariant}`
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📅</div>
              <h3 style={{ color: stitchTheme.colors.onSurface, marginBottom: '8px' }}>
                No meal plan for this week
              </h3>
              <p style={{ color: stitchTheme.colors.onSurfaceVariant, marginBottom: '24px' }}>
                {userRole === 'admin' 
                  ? 'Click "Generate New Week" to create your first weekly meal plan!'
                  : 'Your admin hasn\'t generated a meal plan for this week yet.'}
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
                    fontSize: '14px'
                  }}
                >
                  {generating ? 'Generating...' : '✨ Generate First Week'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Swipe Indicator */}
              {isMobile && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  color: stitchTheme.colors.onSurfaceVariant,
                  fontSize: '12px'
                }}>
                  <span>← Swipe to see more days</span>
                  <span>7 days →</span>
                </div>
              )}

              {/* Horizontal Scroll Container */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '20px',
                padding: '4px 0 32px 0',
                scrollSnapType: isMobile ? 'x mandatory' : 'none',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: `${stitchTheme.colors.primary} ${stitchTheme.colors.outlineVariant}`
              }}>
                {days.map((day, dayIndex) => {
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
                        animation: `slideUp 0.4s ease-out ${dayIndex * 0.05}s both`
                      }}
                    >
                      {/* Day Header */}
                      <div style={{
                        background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                        padding: '16px',
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                          {getDayIcon(day)}
                        </div>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '18px',
                          textTransform: 'capitalize'
                        }}>
                          {formatDayName(day)}
                        </div>
                      </div>

                      {/* Meals */}
                      <div style={{ padding: '16px' }}>
                        {mealTimes.map(time => {
                          const mealId = weeklyPlan[`${day}_${time}`]
                          const meal = getMealById(mealId)
                          const isMealHovered = hoveredMeal === `${day}-${time}`

                          return (
                            <div
                              key={time}
                              onMouseEnter={() => setHoveredMeal(`${day}-${time}`)}
                              onMouseLeave={() => setHoveredMeal(null)}
                              onClick={() => meal && handleMealClick(meal)}
                              style={{
                                marginBottom: '16px',
                                padding: '12px',
                                background: getMealTimeBg(time),
                                borderRadius: '12px',
                                cursor: meal ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                opacity: meal ? 1 : 0.5,
                                transform: isMealHovered && meal ? 'scale(1.02)' : 'scale(1)',
                                border: isMealHovered && meal ? `2px solid ${stitchTheme.colors.primary}` : '2px solid transparent'
                              }}
                            >
                              {/* Time Badge */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  color: stitchTheme.colors.primary,
                                  background: 'rgba(255,255,255,0.5)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px'
                                }}>
                                  {getMealTimeIcon(time)} {time}
                                </span>
                                {meal && (
                                  <span style={{
                                    fontSize: '10px',
                                    color: stitchTheme.colors.onSurfaceVariant
                                  }}>
                                    🔥 {meal.calories} kcal
                                  </span>
                                )}
                              </div>

                              {meal ? (
                                <>
                                  {/* Meal Image */}
                                  <img
                                    src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'}
                                    alt={meal.name}
                                    style={{
                                      width: '100%',
                                      height: isMobile ? '80px' : '70px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      marginBottom: '8px'
                                    }}
                                  />
                                  
                                  {/* Meal Name */}
                                  <div style={{
                                    fontWeight: 600,
                                    fontSize: isMobile ? '13px' : '12px',
                                    color: stitchTheme.colors.onSurface,
                                    marginBottom: '4px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {meal.name}
                                  </div>

                                  {/* Portion Preview */}
                                  <div style={{
                                    fontSize: '10px',
                                    color: stitchTheme.colors.onSurfaceVariant,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {meal.portion}
                                  </div>

                                  {/* Tap indicator */}
                                  <div style={{
                                    marginTop: '8px',
                                    fontSize: '10px',
                                    color: stitchTheme.colors.primary,
                                    textAlign: 'right',
                                    opacity: isMealHovered ? 1 : 0.6
                                  }}>
                                    Tap for details →
                                  </div>
                                </>
                              ) : (
                                <div style={{
                                  height: isMobile ? '100px' : '90px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(255,255,255,0.5)',
                                  borderRadius: '8px',
                                  color: stitchTheme.colors.onSurfaceVariant,
                                  fontSize: '12px'
                                }}>
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
            <div style={{
              marginTop: '32px',
              background: stitchTheme.colors.surface,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${stitchTheme.colors.outlineVariant}`,
              boxShadow: stitchTheme.shadows.sm
            }}>
              <h3 style={{
                margin: `0 0 16px 0`,
                fontSize: '18px',
                color: stitchTheme.colors.onSurface,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span> Week Summary
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div style={{
                  background: `${stitchTheme.colors.secondary}10`,
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: stitchTheme.colors.secondary, marginBottom: '4px' }}>
                    🍳 Breakfast
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stitchTheme.colors.secondary }}>
                    {days.filter(day => weeklyPlan[`${day}_breakfast`]).length}/7
                  </div>
                  <div style={{ fontSize: '11px', color: stitchTheme.colors.secondary }}>
                    meals planned
                  </div>
                </div>
                <div style={{
                  background: `${stitchTheme.colors.tertiary}10`,
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: stitchTheme.colors.tertiary, marginBottom: '4px' }}>
                    🥘 Lunch
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stitchTheme.colors.tertiary }}>
                    {days.filter(day => weeklyPlan[`${day}_lunch`]).length}/7
                  </div>
                  <div style={{ fontSize: '11px', color: stitchTheme.colors.tertiary }}>
                    meals planned
                  </div>
                </div>
                <div style={{
                  background: `${stitchTheme.colors.primary}10`,
                  padding: '16px',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: stitchTheme.colors.primary, marginBottom: '4px' }}>
                    🍲 Dinner
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stitchTheme.colors.primary }}>
                    {days.filter(day => weeklyPlan[`${day}_dinner`]).length}/7
                  </div>
                  <div style={{ fontSize: '11px', color: stitchTheme.colors.primary }}>
                    meals planned
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: `${stitchTheme.colors.surface}/0.8`,
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${stitchTheme.colors.outlineVariant}`,
          padding: '12px 24px',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <Link href="/" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: stitchTheme.colors.onSurfaceVariant,
              padding: '8px 16px',
              borderRadius: '12px'
            }}>
              <span>🍽️</span>
              <span style={{ fontSize: '11px' }}>Library</span>
            </Link>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: `${stitchTheme.colors.primary}10`,
              color: stitchTheme.colors.primary,
              padding: '8px 16px',
              borderRadius: '16px'
            }}>
              <span>📅</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Planner</span>
            </div>
            <Link href="/shopping" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: stitchTheme.colors.onSurfaceVariant,
              padding: '8px 16px',
              borderRadius: '12px'
            }}>
              <span>🛒</span>
              <span style={{ fontSize: '11px' }}>List</span>
            </Link>
          </div>
        </nav>

        {/* Meal Detail Modal */}
        {isMealModalOpen && selectedMeal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setIsMealModalOpen(false)}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: stitchTheme.shadows.xl
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Close button */}
              <button
                onClick={() => setIsMealModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9999px',
                  boxShadow: stitchTheme.shadows.md,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = stitchTheme.colors.error
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.color = stitchTheme.colors.onSurface
                }}
              >
                ✕
              </button>

              {/* Meal Image */}
              <img 
                src={selectedMeal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
                alt={selectedMeal.name}
                style={{ 
                  width: '100%', 
                  height: isMobile ? '200px' : '250px', 
                  objectFit: 'cover',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px'
                }}
              />

              {/* Meal Details */}
              <div style={{ padding: '24px' }}>
                <h2 style={{
                  margin: `0 0 8px 0`,
                  fontSize: isMobile ? '22px' : '28px',
                  color: stitchTheme.colors.onSurface,
                  fontWeight: 700
                }}>
                  {selectedMeal.name}
                </h2>
                
                {/* Tags */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {selectedMeal.category === 'breakfast' ? '🍳' : selectedMeal.category === 'lunch' ? '🥘' : '🍲'} {selectedMeal.category}
                  </span>
                  <span style={{
                    background: `${stitchTheme.colors.secondary}10`,
                    color: stitchTheme.colors.secondary,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔥 {selectedMeal.calories} kcal
                  </span>
                  {selectedMeal.prep_time && (
                    <span style={{
                      background: `${stitchTheme.colors.tertiary}10`,
                      color: stitchTheme.colors.tertiary,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⏱️ {selectedMeal.prep_time}
                    </span>
                  )}
                </div>

                {/* Portion */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    margin: `0 0 8px 0`,
                    color: stitchTheme.colors.onSurfaceVariant,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🍽️</span> Portion Advice
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: stitchTheme.colors.onSurface,
                    lineHeight: 1.5,
                    background: stitchTheme.colors.surfaceContainerLow,
                    padding: '16px',
                    borderRadius: '12px'
                  }}>
                    {selectedMeal.portion}
                  </p>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    margin: `0 0 8px 0`,
                    color: stitchTheme.colors.onSurfaceVariant,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🧺</span> Ingredients
                  </h3>
                  <div style={{
                    background: stitchTheme.colors.surfaceContainerLow,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    {selectedMeal.ingredients?.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px',
                        borderBottom: index < selectedMeal.ingredients.length - 1 ? `1px solid ${stitchTheme.colors.outlineVariant}` : 'none'
                      }}>
                        <span style={{
                          fontWeight: 500,
                          color: stitchTheme.colors.onSurface
                        }}>{item.name}</span>
                        <span style={{
                          color: stitchTheme.colors.primary,
                          fontWeight: 600,
                          background: `${stitchTheme.colors.primary}10`,
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}>{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsMealModalOpen(false)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginTop: '24px',
                    background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: stitchTheme.shadows.md
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = stitchTheme.shadows.glow
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = stitchTheme.shadows.md
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}