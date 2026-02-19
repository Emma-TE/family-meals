'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from "next/image";
import styles from "./page.module.css";
import { supabase } from '../lib/supabase'
import AddMealModal from './components/AddMealModal'
import EditMealModal from './components/EditMealModal'
import { theme, globalStyles } from './styles/globalStyles'

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

  if (loading || !authChecked) {
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
        }}>🍽️</div>
        <div style={{ 
          fontSize: theme.typography.fontSizes.xl,
          color: 'white',
          fontWeight: theme.typography.fontWeights.medium
        }}>Loading meal planner...</div>
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
                  fontWeight: theme.typography.fontWeights.bold
                }}>
                  🍽️ Meal Planner
                </h1>
              </Link>
              
              <Link href="/weekly" style={{
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
                <span>📅</span> Weekly Plan →
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
          {/* Header with Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
            flexWrap: 'wrap',
            gap: theme.spacing.md
          }}>
            <div>
              <h2 style={{
                fontSize: windowWidth < 768 ? theme.typography.fontSizes.xl : theme.typography.fontSizes.xxl,
                color: theme.colors.text.primary,
                margin: `0 0 ${theme.spacing.xs} 0`,
                fontWeight: theme.typography.fontWeights.bold
              }}>
                Our Meal Library
              </h2>
              <p style={{
                color: theme.colors.text.muted,
                margin: 0,
                fontSize: theme.typography.fontSizes.base
              }}>
                {meals.length} delicious meals to choose from
              </p>
            </div>
            
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: theme.colors.primaryGradient,
                  color: 'white',
                  border: 'none',
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  borderRadius: theme.borderRadius.full,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeights.semibold,
                  fontSize: theme.typography.fontSizes.base,
                  boxShadow: theme.shadows.md,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm
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
                <span>➕</span> Add New Meal
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xl,
            flexWrap: 'wrap',
            background: 'white',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.border}`
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? theme.colors.primaryGradient : 'transparent',
                  color: selectedCategory === cat.id ? 'white' : theme.colors.text.secondary,
                  border: 'none',
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  borderRadius: theme.borderRadius.full,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeights.medium,
                  fontSize: theme.typography.fontSizes.base,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  flex: windowWidth < 768 ? 1 : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
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
              padding: theme.spacing.xxl,
              background: 'white',
              borderRadius: theme.borderRadius.lg,
              border: `2px dashed ${theme.colors.border}`,
              animation: theme.animations.fadeIn
            }}>
              <div style={{ fontSize: '64px', marginBottom: theme.spacing.lg }}>🍽️</div>
              <h3 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
                No meals yet
              </h3>
              <p style={{ color: theme.colors.text.muted, marginBottom: theme.spacing.lg }}>
                Click "Add New Meal" to get started with your meal library!
              </p>
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    background: theme.colors.primaryGradient,
                    color: 'white',
                    border: 'none',
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    borderRadius: theme.borderRadius.full,
                    cursor: 'pointer',
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.typography.fontSizes.base
                  }}
                >
                  ✨ Add Your First Meal
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing.lg,
              animation: theme.animations.fadeIn
            }}>
              {filteredMeals.map((meal, index) => (
                <div
                  key={meal.id}
                  style={{
                    animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
                    transform: hoveredMeal === meal.id ? 'translateY(-8px)' : 'translateY(0)'
                  }}
                >
                  <div style={{
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.lg,
                    overflow: 'hidden',
                    background: theme.colors.cardBg,
                    boxShadow: hoveredMeal === meal.id ? theme.shadows.hover : theme.shadows.md,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={() => setHoveredMeal(meal.id)}
                  onMouseLeave={() => setHoveredMeal(null)}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
                        alt={meal.name}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          transform: hoveredMeal === meal.id ? 'scale(1.05)' : 'scale(1)'
                        }}
                      />
                      {hoveredMeal === meal.id && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.1)'
                        }} />
                      )}
                    </div>

                    {/* Admin Controls */}
                    {userRole === 'admin' && (
                      <div style={{
                        position: 'absolute',
                        top: theme.spacing.md,
                        right: theme.spacing.md,
                        display: 'flex',
                        gap: theme.spacing.xs,
                        zIndex: 1
                      }}>
                        <button 
                          onClick={() => {
                            setSelectedMeal(meal)
                            setIsEditModalOpen(true)
                          }}
                          style={{
                            background: 'white',
                            color: theme.colors.primary,
                            border: 'none',
                            padding: theme.spacing.sm,
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: theme.typography.fontSizes.sm,
                            fontWeight: theme.typography.fontWeights.medium,
                            boxShadow: theme.shadows.md,
                            transition: 'all 0.2s',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.colors.primary
                            e.currentTarget.style.color = 'white'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.color = theme.colors.primary
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteMeal(meal.id)}
                          style={{
                            background: 'white',
                            color: theme.colors.danger,
                            border: 'none',
                            padding: theme.spacing.sm,
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: theme.typography.fontSizes.sm,
                            boxShadow: theme.shadows.md,
                            transition: 'all 0.2s',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.colors.danger
                            e.currentTarget.style.color = 'white'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.color = theme.colors.danger
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ padding: theme.spacing.lg, flex: 1 }}>
                      <h3 style={{
                        margin: `0 0 ${theme.spacing.xs} 0`,
                        fontSize: theme.typography.fontSizes.lg,
                        color: theme.colors.text.primary,
                        fontWeight: theme.typography.fontWeights.semibold
                      }}>
                        {meal.name}
                      </h3>
                      
                      <div style={{
                        display: 'flex',
                        gap: theme.spacing.xs,
                        marginBottom: theme.spacing.md,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: theme.colors.primary,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          borderRadius: theme.borderRadius.full,
                          fontSize: theme.typography.fontSizes.xs,
                          fontWeight: theme.typography.fontWeights.medium,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {meal.category === 'breakfast' ? '🍳' : meal.category === 'lunch' ? '🥘' : '🍲'} {meal.category}
                        </span>
                        <span style={{
                          background: 'rgba(72, 187, 120, 0.1)',
                          color: theme.colors.secondaryDark,
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          borderRadius: theme.borderRadius.full,
                          fontSize: theme.typography.fontSizes.xs,
                          fontWeight: theme.typography.fontWeights.medium,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          🔥 {meal.calories} kcal
                        </span>
                        {meal.prep_time && (
                          <span style={{
                            background: 'rgba(237, 137, 54, 0.1)',
                            color: '#dd6b20',
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            borderRadius: theme.borderRadius.full,
                            fontSize: theme.typography.fontSizes.xs,
                            fontWeight: theme.typography.fontWeights.medium,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ⏱️ {meal.prep_time}
                          </span>
                        )}
                      </div>

                      <p style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.typography.fontSizes.sm,
                        margin: `0 0 ${theme.spacing.md} 0`,
                        lineHeight: 1.6
                      }}>
                        <strong>Portion:</strong> {meal.portion}
                      </p>

                      <details style={{
                        marginTop: 'auto'
                      }}>
                        <summary style={{
                          cursor: 'pointer',
                          color: theme.colors.primary,
                          fontSize: theme.typography.fontSizes.sm,
                          fontWeight: theme.typography.fontWeights.medium,
                          padding: theme.spacing.sm,
                          borderRadius: theme.borderRadius.sm,
                          background: 'rgba(102, 126, 234, 0.05)',
                          listStyle: 'none'
                        }}>
                          📋 View Ingredients
                        </summary>
                        <ul style={{
                          marginTop: theme.spacing.md,
                          paddingLeft: theme.spacing.lg,
                          color: theme.colors.text.secondary
                        }}>
                          {meal.ingredients?.map((item, index) => (
                            <li key={index} style={{
                              padding: theme.spacing.xs,
                              borderBottom: index < meal.ingredients.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>{item.name}</span>
                              <span style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeights.medium }}>
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
        </div>

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