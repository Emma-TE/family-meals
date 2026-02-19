'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { theme, globalStyles } from '../styles/globalStyles'

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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: theme.colors.primaryGradient,
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: theme.spacing.xl
      }}>
        <div style={{ 
          fontSize: '64px',
          animation: theme.animations.bounce
        }}>📅</div>
        <div style={{ 
          fontSize: theme.typography.fontSizes.xl,
          color: 'white',
          fontWeight: theme.typography.fontWeights.medium
        }}>Loading weekly plan...</div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: `3px solid white`,
          borderRadius: theme.borderRadius.full,
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        background: theme.colors.background,
        animation: theme.animations.fadeIn
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderBottom: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.sm,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.9)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: theme.spacing.md,
            display: 'flex',
            flexDirection: windowWidth < 768 ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: windowWidth < 768 ? 'stretch' : 'center',
            gap: theme.spacing.md
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.lg,
              flexWrap: 'wrap'
            }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: windowWidth < 768 ? theme.typography.fontSizes.xl : theme.typography.fontSizes.xxl,
                  background: theme.colors.primaryGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: theme.typography.fontWeights.bold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}>
                  <span>📅</span> Weekly Plan
                </h1>
              </Link>
              
              <Link href="/" style={{
                color: theme.colors.primary,
                textDecoration: 'none',
                fontSize: theme.typography.fontSizes.lg,
                fontWeight: theme.typography.fontWeights.medium,
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.full,
                background: 'rgba(102, 126, 234, 0.1)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
              >
                <span>🍽️</span> Meal Library →
              </Link>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.lg,
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                background: '#f7fafc',
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.full,
                border: `1px solid ${theme.colors.border}`
              }}>
                <span style={{ fontSize: theme.typography.fontSizes.lg }}>👤</span>
                <span style={{
                  fontSize: theme.typography.fontSizes.sm,
                  color: theme.colors.text.secondary,
                  maxWidth: windowWidth < 768 ? '120px' : '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email}
                </span>
                {userRole === 'admin' && (
                  <span style={{
                    background: theme.colors.primaryGradient,
                    color: 'white',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSizes.xs,
                    fontWeight: theme.typography.fontWeights.semibold,
                    marginLeft: theme.spacing.xs
                  }}>
                    Admin
                  </span>
                )}
              </div>
              
              <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth/login')
                }} 
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  fontSize: theme.typography.fontSizes.sm,
                  background: theme.colors.danger,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.full,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeights.medium,
                  boxShadow: theme.shadows.sm,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.dangerDark
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = theme.shadows.md
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.danger
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = theme.shadows.sm
                }}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: theme.spacing.xl }}>
          {/* Week Header */}
          <div style={{
            display: 'flex',
            flexDirection: windowWidth < 768 ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: windowWidth < 768 ? 'flex-start' : 'center',
            marginBottom: theme.spacing.xl,
            gap: theme.spacing.md
          }}>
            <div style={{
              background: 'white',
              padding: theme.spacing.lg,
              borderRadius: theme.borderRadius.lg,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.border}`,
              flex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div style={{
                  background: theme.colors.primaryGradient,
                  width: '50px',
                  height: '50px',
                  borderRadius: theme.borderRadius.full,
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
                    fontSize: theme.typography.fontSizes.sm,
                    color: theme.colors.text.muted,
                    marginBottom: theme.spacing.xs
                  }}>
                    Current Week
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: windowWidth < 768 ? theme.typography.fontSizes.lg : theme.typography.fontSizes.xl,
                    color: theme.colors.text.primary,
                    fontWeight: theme.typography.fontWeights.semibold
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
                  background: generating ? '#ccc' : theme.colors.primaryGradient,
                  color: 'white',
                  border: 'none',
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  borderRadius: theme.borderRadius.full,
                  cursor: generating ? 'not-allowed' : 'pointer',
                  fontWeight: theme.typography.fontWeights.semibold,
                  fontSize: theme.typography.fontSizes.base,
                  boxShadow: theme.shadows.md,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  width: windowWidth < 768 ? '100%' : 'auto',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!generating) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = theme.shadows.hover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!generating) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = theme.shadows.md
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
              padding: theme.spacing.xxl,
              background: 'white',
              borderRadius: theme.borderRadius.lg,
              border: `2px dashed ${theme.colors.border}`,
              animation: theme.animations.fadeIn
            }}>
              <div style={{ fontSize: '64px', marginBottom: theme.spacing.lg }}>📅</div>
              <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
                No meal plan for this week
              </h3>
              <p style={{ color: theme.colors.text.muted, marginBottom: theme.spacing.lg }}>
                {userRole === 'admin' 
                  ? 'Click "Generate New Week" to create your first weekly meal plan!'
                  : 'Your admin hasn\'t generated a meal plan for this week yet.'}
              </p>
              {userRole === 'admin' && (
                <button
                  onClick={generateNewWeek}
                  disabled={generating}
                  style={{
                    background: generating ? '#ccc' : theme.colors.primaryGradient,
                    color: 'white',
                    border: 'none',
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    borderRadius: theme.borderRadius.full,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.typography.fontSizes.base
                  }}
                >
                  {generating ? 'Generating...' : '✨ Generate First Week'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Swipe Indicator */}
              {windowWidth < 768 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing.md,
                  padding: `0 ${theme.spacing.xs}`,
                  color: theme.colors.text.muted,
                  fontSize: theme.typography.fontSizes.sm
                }}>
                  <span>← Swipe to see more days</span>
                  <span>7 days →</span>
                </div>
              )}

              {/* Horizontal Scroll Container */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: theme.spacing.lg,
                padding: `${theme.spacing.xs} 0 ${theme.spacing.xl} 0`,
                scrollSnapType: windowWidth < 768 ? 'x mandatory' : 'none',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.colors.primary} ${theme.colors.border}`
              }}>
                {days.map((day, dayIndex) => {
                  const isHovered = hoveredDay === day
                  return (
                    <div
                      key={day}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        minWidth: windowWidth < 768 ? '85%' : 'calc(14.28% - 13px)',
                        scrollSnapAlign: windowWidth < 768 ? 'start' : 'none',
                        background: 'white',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.lg,
                        overflow: 'hidden',
                        boxShadow: isHovered ? theme.shadows.hover : theme.shadows.md,
                        transition: 'all 0.3s ease',
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                        animation: `slideUp 0.4s ease-out ${dayIndex * 0.05}s both`
                      }}
                    >
                      {/* Day Header */}
                      <div style={{
                        background: theme.colors.primaryGradient,
                        padding: theme.spacing.md,
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: theme.spacing.xs }}>
                          {getDayIcon(day)}
                        </div>
                        <div style={{
                          fontWeight: theme.typography.fontWeights.bold,
                          fontSize: theme.typography.fontSizes.lg,
                          textTransform: 'capitalize'
                        }}>
                          {formatDayName(day)}
                        </div>
                      </div>

                      {/* Meals */}
                      <div style={{ padding: theme.spacing.md }}>
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
                                marginBottom: theme.spacing.md,
                                padding: theme.spacing.sm,
                                background: time === 'breakfast' ? '#fff4e6' :
                                           time === 'lunch' ? '#e6f3ff' : '#f0e6ff',
                                borderRadius: theme.borderRadius.md,
                                cursor: meal ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                opacity: meal ? 1 : 0.5,
                                transform: isMealHovered && meal ? 'scale(1.02)' : 'scale(1)',
                                border: isMealHovered && meal ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Time Badge */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: theme.spacing.xs
                              }}>
                                <span style={{
                                  fontSize: theme.typography.fontSizes.xs,
                                  fontWeight: theme.typography.fontWeights.bold,
                                  textTransform: 'uppercase',
                                  color: time === 'breakfast' ? '#b45f06' :
                                         time === 'lunch' ? '#0b5e8a' : '#6b21a5',
                                  background: 'rgba(255,255,255,0.5)',
                                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                  borderRadius: theme.borderRadius.sm
                                }}>
                                  {time === 'breakfast' ? '🍳 Breakfast' :
                                   time === 'lunch' ? '🥘 Lunch' : '🍲 Dinner'}
                                </span>
                                {meal && (
                                  <span style={{
                                    fontSize: theme.typography.fontSizes.xs,
                                    color: theme.colors.text.muted
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
                                      height: windowWidth < 768 ? '80px' : '60px',
                                      objectFit: 'cover',
                                      borderRadius: theme.borderRadius.sm,
                                      marginBottom: theme.spacing.xs
                                    }}
                                  />
                                  
                                  {/* Meal Name */}
                                  <div style={{
                                    fontWeight: theme.typography.fontWeights.semibold,
                                    fontSize: windowWidth < 768 ? theme.typography.fontSizes.sm : theme.typography.fontSizes.xs,
                                    color: theme.colors.text.primary,
                                    marginBottom: theme.spacing.xs,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {meal.name}
                                  </div>

                                  {/* Portion Preview */}
                                  <div style={{
                                    fontSize: theme.typography.fontSizes.xs,
                                    color: theme.colors.text.muted,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {meal.portion}
                                  </div>

                                  {/* Tap indicator */}
                                  <div style={{
                                    marginTop: theme.spacing.xs,
                                    fontSize: theme.typography.fontSizes.xs,
                                    color: theme.colors.primary,
                                    textAlign: 'right',
                                    opacity: isMealHovered ? 1 : 0.7
                                  }}>
                                    Tap for details →
                                  </div>
                                </>
                              ) : (
                                <div style={{
                                  height: windowWidth < 768 ? '100px' : '80px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(255,255,255,0.5)',
                                  borderRadius: theme.borderRadius.sm,
                                  color: theme.colors.text.muted,
                                  fontSize: theme.typography.fontSizes.sm
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
              marginTop: theme.spacing.xl,
              background: 'white',
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm
            }}>
              <h3 style={{
                margin: `0 0 ${theme.spacing.md} 0`,
                fontSize: theme.typography.fontSizes.lg,
                color: theme.colors.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <span>📊</span> Week Summary
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
                gap: theme.spacing.md
              }}>
                <div style={{
                  background: '#fff4e6',
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md
                }}>
                  <div style={{ fontSize: theme.typography.fontSizes.sm, color: '#b45f06', marginBottom: theme.spacing.xs }}>
                    🍳 Breakfast
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xl, fontWeight: theme.typography.fontWeights.bold, color: '#b45f06' }}>
                    {days.filter(day => weeklyPlan[`${day}_breakfast`]).length}/7
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xs, color: '#b45f06' }}>
                    meals planned
                  </div>
                </div>
                <div style={{
                  background: '#e6f3ff',
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md
                }}>
                  <div style={{ fontSize: theme.typography.fontSizes.sm, color: '#0b5e8a', marginBottom: theme.spacing.xs }}>
                    🥘 Lunch
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xl, fontWeight: theme.typography.fontWeights.bold, color: '#0b5e8a' }}>
                    {days.filter(day => weeklyPlan[`${day}_lunch`]).length}/7
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xs, color: '#0b5e8a' }}>
                    meals planned
                  </div>
                </div>
                <div style={{
                  background: '#f0e6ff',
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md
                }}>
                  <div style={{ fontSize: theme.typography.fontSizes.sm, color: '#6b21a5', marginBottom: theme.spacing.xs }}>
                    🍲 Dinner
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xl, fontWeight: theme.typography.fontWeights.bold, color: '#6b21a5' }}>
                    {days.filter(day => weeklyPlan[`${day}_dinner`]).length}/7
                  </div>
                  <div style={{ fontSize: theme.typography.fontSizes.xs, color: '#6b21a5' }}>
                    meals planned
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
            padding: theme.spacing.lg,
            animation: theme.animations.fadeIn
          }} onClick={() => setIsMealModalOpen(false)}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.xl,
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: theme.shadows.xl
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Close button */}
              <button
                onClick={() => setIsMealModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: theme.spacing.md,
                  right: theme.spacing.md,
                  background: 'white',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  borderRadius: theme.borderRadius.full,
                  boxShadow: theme.shadows.md,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.danger
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.color = theme.colors.text.primary
                  e.currentTarget.style.transform = 'scale(1)'
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
                  height: windowWidth < 768 ? '200px' : '250px', 
                  objectFit: 'cover',
                  borderTopLeftRadius: theme.borderRadius.xl,
                  borderTopRightRadius: theme.borderRadius.xl
                }}
              />

              {/* Meal Details */}
              <div style={{ padding: theme.spacing.xl }}>
                <h2 style={{
                  margin: `0 0 ${theme.spacing.xs} 0`,
                  fontSize: windowWidth < 768 ? theme.typography.fontSizes.xl : theme.typography.fontSizes.xxl,
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeights.bold
                }}>
                  {selectedMeal.name}
                </h2>
                
                {/* Tags */}
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.lg,
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: theme.colors.primaryGradient,
                    color: 'white',
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.medium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {selectedMeal.category === 'breakfast' ? '🍳' : selectedMeal.category === 'lunch' ? '🥘' : '🍲'} {selectedMeal.category}
                  </span>
                  <span style={{
                    background: 'rgba(72, 187, 120, 0.1)',
                    color: theme.colors.secondaryDark,
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.medium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔥 {selectedMeal.calories} kcal
                  </span>
                  {selectedMeal.prep_time && (
                    <span style={{
                      background: 'rgba(237, 137, 54, 0.1)',
                      color: '#dd6b20',
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      borderRadius: theme.borderRadius.full,
                      fontSize: theme.typography.fontSizes.sm,
                      fontWeight: theme.typography.fontWeights.medium,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⏱️ {selectedMeal.prep_time}
                    </span>
                  )}
                </div>

                {/* Portion */}
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <h3 style={{
                    fontSize: theme.typography.fontSizes.lg,
                    margin: `0 0 ${theme.spacing.sm} 0`,
                    color: theme.colors.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <span style={{ fontSize: '24px' }}>🍽️</span> Portion Advice
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: theme.typography.fontSizes.base,
                    color: theme.colors.text.primary,
                    lineHeight: 1.6,
                    background: '#f7fafc',
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md
                  }}>
                    {selectedMeal.portion}
                  </p>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 style={{
                    fontSize: theme.typography.fontSizes.lg,
                    margin: `0 0 ${theme.spacing.sm} 0`,
                    color: theme.colors.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <span style={{ fontSize: '24px' }}>🧺</span> Ingredients
                  </h3>
                  <div style={{
                    background: '#f7fafc',
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md
                  }}>
                    {selectedMeal.ingredients?.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: theme.spacing.sm,
                        borderBottom: index < selectedMeal.ingredients.length - 1 ? `1px solid ${theme.colors.border}` : 'none'
                      }}>
                        <span style={{
                          fontWeight: theme.typography.fontWeights.medium,
                          color: theme.colors.text.primary
                        }}>{item.name}</span>
                        <span style={{
                          color: theme.colors.primary,
                          fontWeight: theme.typography.fontWeights.semibold,
                          background: 'rgba(102, 126, 234, 0.1)',
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          borderRadius: theme.borderRadius.sm
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
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.xl,
                    background: theme.colors.primaryGradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSizes.base,
                    fontWeight: theme.typography.fontWeights.semibold,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: theme.shadows.md
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = theme.shadows.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = theme.shadows.md
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