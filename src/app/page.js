'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import AddMealModal from './components/AddMealModal'
import EditMealModal from './components/EditMealModal'
import { stitchTheme, globalStyles } from './styles/stitchTheme'
import UserMenu from './components/UserMenu'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meals, setMeals] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [authChecked, setAuthChecked] = useState(false)
  const [hoveredMeal, setHoveredMeal] = useState(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth error:', error)
        setLoading(false)
        setAuthChecked(true)
        return
      }
      
      if (!session) {
        router.push('/auth/login')
        setLoading(false)
        setAuthChecked(true)
        return
      }
      
      setUser(session.user)
      await fetchUserRole(session.user.id)
      await fetchMeals()
      setLoading(false)
      setAuthChecked(true)
    } catch (err) {
      console.error('Check user error:', err)
      setLoading(false)
      setAuthChecked(true)
    }
  }

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error)
        setUserRole('viewer')
      } else {
        setUserRole(data?.role || 'viewer')
      }
    } catch (err) {
      console.error('Fetch role error:', err)
      setUserRole('viewer')
    }
  }

  async function fetchMeals() {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('category')
      
      if (error) {
        console.error('Error fetching meals:', error)
      } else {
        setMeals(data || [])
      }
    } catch (err) {
      console.error('Fetch meals error:', err)
    }
  }

  async function handleDeleteMeal(mealId) {
    if (userRole !== 'admin') return
    
    if (confirm('Are you sure you want to delete this meal?')) {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
      
      if (error) {
        alert('Error deleting meal: ' + error.message)
      } else {
        fetchMeals()
      }
    }
  }
  
  const handleMealAdded = (newMeal) => {
    setMeals([...meals, newMeal])
  }

  const handleMealUpdated = (updatedMeal) => {
    setMeals(meals.map(meal => 
      meal.id === updatedMeal.id ? updatedMeal : meal
    ))
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'breakfast': return '🍳'
      case 'lunch': return '🥘'
      case 'dinner': return '🍲'
      default: return '🍽️'
    }
  }

  const isMobile = windowWidth < 768

  if (loading || !authChecked) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: stitchTheme.colors.primaryGradient || `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ 
          fontSize: '64px',
          animation: 'bounce 2s infinite'
        }}>🍽️</div>
        <div style={{ 
          fontSize: '18px',
          color: 'white',
          fontWeight: 500
        }}>Loading meal planner...</div>
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

  if (!user) {
    return null
  }

  const filteredMeals = selectedCategory === 'all' 
    ? meals 
    : meals.filter(meal => meal.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Meals', icon: '🍽️' },
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🥘' },
    { id: 'dinner', label: 'Dinner', icon: '🍲' }
  ]

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
              🍽️ Meal Library
            </h1>
            
            <UserMenu user={user} userRole={userRole} />
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Header with Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '24px' : '32px',
                color: stitchTheme.colors.onSurface,
                margin: 0,
                fontWeight: 800
              }}>
                Our Meal Library
              </h2>
              <p style={{
                color: stitchTheme.colors.onSurfaceVariant,
                margin: '4px 0 0',
                fontSize: '14px'
              }}>
                {meals.length} delicious meals to choose from
              </p>
            </div>
            
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                  color: stitchTheme.colors.onPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: stitchTheme.shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                <span>➕</span> Add New Meal
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            background: stitchTheme.colors.surfaceContainerLow,
            padding: '16px',
            borderRadius: '16px'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)` : 'transparent',
                  color: selectedCategory === cat.id ? stitchTheme.colors.onPrimary : stitchTheme.colors.onSurfaceVariant,
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: isMobile ? 1 : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.background = `${stitchTheme.colors.primary}10`
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Meal Grid */}
          {meals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: stitchTheme.colors.surfaceContainerLow,
              borderRadius: '24px',
              border: `2px dashed ${stitchTheme.colors.outlineVariant}`
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🍽️</div>
              <h3 style={{ color: stitchTheme.colors.onSurface, marginBottom: '8px' }}>
                No meals yet
              </h3>
              <p style={{ color: stitchTheme.colors.onSurfaceVariant, marginBottom: '24px' }}>
                Click "Add New Meal" to get started with your meal library!
              </p>
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                    color: stitchTheme.colors.onPrimary,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ✨ Add Your First Meal
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {filteredMeals.map((meal, index) => (
                <div
                  key={meal.id}
                  style={{
                    animation: `slideUp 0.4s ease-out ${index * 0.03}s both`,
                    transform: hoveredMeal === meal.id ? 'translateY(-8px)' : 'translateY(0)'
                  }}
                >
                  <div style={{
                    background: stitchTheme.colors.surface,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: hoveredMeal === meal.id ? stitchTheme.shadows.lg : stitchTheme.shadows.md,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${stitchTheme.colors.outlineVariant}`
                  }}
                  onMouseEnter={() => setHoveredMeal(meal.id)}
                  onMouseLeave={() => setHoveredMeal(null)}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
                      <img 
                        src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
                        alt={meal.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          transform: hoveredMeal === meal.id ? 'scale(1.08)' : 'scale(1)'
                        }}
                      />
                      {/* Category Tag Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: stitchTheme.colors.surface,
                        backdropFilter: 'blur(8px)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: stitchTheme.colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{getCategoryIcon(meal.category)}</span>
                        <span>{meal.category}</span>
                      </div>
                    </div>

                    {/* Admin Controls */}
                    {userRole === 'admin' && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 1
                      }}>
                        <button 
                          onClick={() => {
                            setSelectedMeal(meal)
                            setIsEditModalOpen(true)
                          }}
                          style={{
                            background: stitchTheme.colors.surface,
                            color: stitchTheme.colors.primary,
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            boxShadow: stitchTheme.shadows.sm,
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = stitchTheme.colors.primary
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = stitchTheme.colors.surface
                            e.currentTarget.style.color = stitchTheme.colors.primary
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteMeal(meal.id)}
                          style={{
                            background: stitchTheme.colors.surface,
                            color: stitchTheme.colors.error,
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            boxShadow: stitchTheme.shadows.sm,
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = stitchTheme.colors.error
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = stitchTheme.colors.surface
                            e.currentTarget.style.color = stitchTheme.colors.error
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ padding: '20px', flex: 1 }}>
                      <h3 style={{
                        margin: `0 0 8px 0`,
                        fontSize: '18px',
                        color: stitchTheme.colors.onSurface,
                        fontWeight: 700,
                        lineHeight: 1.3
                      }}>
                        {meal.name}
                      </h3>
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          background: `${stitchTheme.colors.secondary}10`,
                          color: stitchTheme.colors.secondary,
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          🔥 {meal.calories} kcal
                        </span>
                        {meal.prep_time && (
                          <span style={{
                            background: `${stitchTheme.colors.tertiary}10`,
                            color: stitchTheme.colors.tertiary,
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ⏱️ {meal.prep_time}
                          </span>
                        )}
                      </div>

                      <p style={{
                        color: stitchTheme.colors.onSurfaceVariant,
                        fontSize: '13px',
                        margin: `0 0 16px 0`,
                        lineHeight: 1.5
                      }}>
                        <strong>Portion:</strong> {meal.portion}
                      </p>

                      <details style={{
                        marginTop: 'auto'
                      }}>
                        <summary style={{
                          cursor: 'pointer',
                          color: stitchTheme.colors.primary,
                          fontSize: '13px',
                          fontWeight: 500,
                          padding: '8px',
                          borderRadius: '8px',
                          background: `${stitchTheme.colors.primary}05`,
                          listStyle: 'none'
                        }}>
                          📋 View Ingredients
                        </summary>
                        <ul style={{
                          marginTop: '12px',
                          paddingLeft: '20px',
                          color: stitchTheme.colors.onSurfaceVariant
                        }}>
                          {meal.ingredients?.map((item, index) => (
                            <li key={index} style={{
                              padding: '6px 0',
                              borderBottom: index < meal.ingredients.length - 1 ? `1px solid ${stitchTheme.colors.outlineVariant}` : 'none',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '12px'
                            }}>
                              <span>{item.name}</span>
                              <span style={{ color: stitchTheme.colors.primary, fontWeight: 500 }}>
                                {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
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
              <span>🍽️</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Library</span>
            </div>
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

        {/* Modals */}
        <AddMealModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMealAdded={handleMealAdded}
        />

        <EditMealModal 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedMeal(null)
          }}
          meal={selectedMeal}
          onMealUpdated={handleMealUpdated}
        />
      </div>
    </>
  )
}