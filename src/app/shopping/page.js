'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { stitchTheme, globalStyles } from '../styles/stitchTheme'
import UserMenu from '../components/UserMenu'

export default function ShoppingListPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [meals, setMeals] = useState([])
  const [shoppingItems, setShoppingItems] = useState([])
  const [checkedItems, setCheckedItems] = useState({})
  const [currentWeek, setCurrentWeek] = useState('')
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

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

  useEffect(() => {
    if (weeklyPlan && meals.length > 0) {
      generateShoppingList()
    }
  }, [weeklyPlan, meals])

  function generateShoppingList() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const mealTimes = ['breakfast', 'lunch', 'dinner']
    
    const allIngredients = []
    
    days.forEach(day => {
      mealTimes.forEach(time => {
        const mealId = weeklyPlan[`${day}_${time}`]
        const meal = meals.find(m => m.id === mealId)
        if (meal && meal.ingredients) {
          meal.ingredients.forEach(ing => {
            allIngredients.push({
              ...ing,
              mealName: meal.name,
              day: day,
              time: time
            })
          })
        }
      })
    })
    
    const consolidated = {}
    allIngredients.forEach(ing => {
      const key = ing.name.toLowerCase().trim()
      if (!consolidated[key]) {
        consolidated[key] = {
          name: ing.name,
          quantity: ing.quantity,
          occurrences: [ing]
        }
      } else {
        consolidated[key].occurrences.push(ing)
      }
    })
    
    const sortedItems = Object.values(consolidated).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
    
    setShoppingItems(sortedItems)
    
    const initialChecked = {}
    sortedItems.forEach((_, index) => {
      initialChecked[index] = false
    })
    setCheckedItems(initialChecked)
  }

  const toggleItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const clearChecked = () => {
    const resetChecked = {}
    shoppingItems.forEach((_, index) => {
      resetChecked[index] = false
    })
    setCheckedItems(resetChecked)
  }

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(v => v === true).length
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: stitchTheme.colors.background,
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '64px' }}>🛒</div>
        <div style={{ fontSize: '18px', color: stitchTheme.colors.onSurfaceVariant }}>
          Loading shopping list...
        </div>
      </div>
    )
  }

  const isMobile = windowWidth < 768

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
            🛒 Shopping List
            </h1>
            
            <UserMenu user={user} userRole={userRole} />
        </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Week Header */}
          <div style={{
            background: stitchTheme.colors.surfaceContainerLow,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px'
            }}>
              🛒
            </div>
            <h2 style={{
              fontFamily: stitchTheme.typography.headline,
              fontSize: '20px',
              fontWeight: 600,
              color: stitchTheme.colors.onSurface,
              margin: 0
            }}>
              Week of {new Date(currentWeek).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            <p style={{
              color: stitchTheme.colors.onSurfaceVariant,
              fontSize: '14px',
              marginTop: '8px'
            }}>
              {shoppingItems.length} items to buy
            </p>
          </div>

          {/* Progress Bar */}
          {shoppingItems.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                color: stitchTheme.colors.onSurfaceVariant
              }}>
                <span>Progress</span>
                <span>{getCheckedCount()} / {shoppingItems.length}</span>
              </div>
              <div style={{
                height: '8px',
                background: stitchTheme.colors.outlineVariant,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(getCheckedCount() / shoppingItems.length) * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${stitchTheme.colors.secondary}, ${stitchTheme.colors.secondaryContainer})`,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Shopping List Items */}
          {shoppingItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: stitchTheme.colors.surfaceContainerLow,
              borderRadius: '24px',
              border: `2px dashed ${stitchTheme.colors.outlineVariant}`
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
              <h3 style={{
                fontFamily: stitchTheme.typography.headline,
                fontSize: '18px',
                fontWeight: 600,
                color: stitchTheme.colors.onSurface,
                marginBottom: '8px'
              }}>
                No active shopping list
              </h3>
              <p style={{ color: stitchTheme.colors.onSurfaceVariant }}>
                Generate a weekly plan to see your shopping list
              </p>
              <Link href="/weekly" style={{
                display: 'inline-block',
                marginTop: '24px',
                background: `linear-gradient(135deg, ${stitchTheme.colors.primary}, ${stitchTheme.colors.primaryContainer})`,
                color: stitchTheme.colors.onPrimary,
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '9999px',
                fontWeight: 600
              }}>
                Go to Weekly Planner
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      height: '2px',
                      flex: 1,
                      background: stitchTheme.colors.outlineVariant
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: stitchTheme.colors.onSurfaceVariant
                    }}>
                      All Items
                    </span>
                    <div style={{
                      height: '2px',
                      flex: 1,
                      background: stitchTheme.colors.outlineVariant
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shoppingItems.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => toggleItem(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: checkedItems[index] 
                          ? stitchTheme.colors.surfaceContainerLow 
                          : stitchTheme.colors.surface,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                        opacity: checkedItems[index] ? 0.6 : 1,
                        textDecoration: checkedItems[index] ? 'line-through' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!checkedItems[index]) {
                          e.currentTarget.style.transform = 'translateX(4px)'
                          e.currentTarget.style.borderColor = stitchTheme.colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.borderColor = stitchTheme.colors.outlineVariant
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        border: `2px solid ${checkedItems[index] ? stitchTheme.colors.secondary : stitchTheme.colors.primary}`,
                        background: checkedItems[index] ? stitchTheme.colors.secondary : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {checkedItems[index] && (
                          <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          color: stitchTheme.colors.onSurface,
                          fontSize: isMobile ? '15px' : '16px'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: stitchTheme.colors.onSurfaceVariant,
                          marginTop: '4px'
                        }}>
                          {item.quantity}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '11px',
                        color: stitchTheme.colors.primary,
                        background: `${stitchTheme.colors.primary}10`,
                        padding: '4px 8px',
                        borderRadius: '9999px'
                      }}>
                        {item.occurrences.length} meal{item.occurrences.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                {getCheckedCount() > 0 && (
                  <button
                    onClick={clearChecked}
                    style={{
                      marginTop: '24px',
                      width: '100%',
                      padding: '14px',
                      background: 'transparent',
                      border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                      borderRadius: '9999px',
                      color: stitchTheme.colors.onSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = stitchTheme.colors.surfaceContainerLow
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Clear Checked Items
                  </button>
                )}
              </div>

              {/* Print Button */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: stitchTheme.colors.surfaceContainer,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    color: stitchTheme.colors.onSurface,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🖨️</span> Print Shopping List
                </button>
              </div>
            </>
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
            <Link href="/weekly" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: stitchTheme.colors.onSurfaceVariant,
              padding: '8px 16px',
              borderRadius: '12px'
            }}>
              <span>📅</span>
              <span style={{ fontSize: '11px' }}>Planner</span>
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
              <span>🛒</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>List</span>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}