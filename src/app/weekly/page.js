'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    // Get the start of current week (Monday)
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
      // Check if plan already exists for this week
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
        
        // Delete existing plan
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
    
      // Group meals by category
      const breakfastMeals = meals.filter(m => m.category === 'breakfast')
      const lunchMeals = meals.filter(m => m.category === 'lunch')
      const dinnerMeals = meals.filter(m => m.category === 'dinner')
    
      // Check if we have enough meals
      if (breakfastMeals.length === 0 || lunchMeals.length === 0 || dinnerMeals.length === 0) {
        alert('Please add at least one breakfast, lunch, and dinner meal first.')
        setGenerating(false)
        return
      }
    
      // Shuffle arrays to get random meals
      const shuffle = (array) => array.sort(() => Math.random() - 0.5)
      
      const shuffledBreakfast = shuffle([...breakfastMeals])
      const shuffledLunch = shuffle([...lunchMeals])
      const shuffledDinner = shuffle([...dinnerMeals])
    
      // Create weekly plan object
      const weekStart = currentWeek
      const newPlan = { week_start: weekStart }
    
      days.forEach((day, index) => {
        newPlan[`${day}_breakfast`] = shuffledBreakfast[index % shuffledBreakfast.length]?.id
        newPlan[`${day}_lunch`] = shuffledLunch[index % shuffledLunch.length]?.id
        newPlan[`${day}_dinner`] = shuffledDinner[index % shuffledDinner.length]?.id
      })
    
      console.log('Attempting to insert plan:', newPlan)

      // Save to database
      const { data, error } = await supabase
        .from('weekly_plans')
        .insert([newPlan])
        .select()
    
      if (error) {
        console.error('Insert error details:', error)
        alert('Error generating week: ' + error.message + '\n\nCheck console for details')
      } else {
        console.log('Insert successful:', data)
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

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: windowWidth < 768 ? 'flex-start' : 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee',
        gap: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: windowWidth < 768 ? 'column' : 'row',
          alignItems: windowWidth < 768 ? 'flex-start' : 'center',
          gap: '10px'
        }}>
          <h1 style={{ margin: 0, fontSize: windowWidth < 768 ? '20px' : '24px' }}>
            📅 Weekly Meal Plan
          </h1>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Meals
          </Link>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px' }}>{user?.email}</span>
          <button onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Week Controls */}
      <div style={{ 
        display: 'flex', 
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: windowWidth < 768 ? 'flex-start' : 'center',
        marginBottom: '30px',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ fontSize: windowWidth < 768 ? '18px' : '22px' }}>
            Week of {new Date(currentWeek).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={generateNewWeek}
            disabled={generating}
            style={{
              background: generating ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              width: windowWidth < 768 ? '100%' : 'auto'
            }}
          >
            {generating ? 'Generating...' : '🔄 Generate New Week'}
          </button>
        )}
      </div>

      {/* Weekly Grid - Mobile Responsive with Horizontal Scroll */}
      {!weeklyPlan ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <p style={{ marginBottom: '20px' }}>No meal plan for this week yet.</p>
          {userRole === 'admin' && (
            <button
              onClick={generateNewWeek}
              disabled={generating}
              style={{
                background: generating ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '5px',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                width: windowWidth < 768 ? '100%' : 'auto'
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
              marginBottom: '10px',
              padding: '0 5px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                ← Swipe to see more days
              </span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {days.length} days →
              </span>
            </div>
          )}

          {/* Horizontal Scroll Container */}
          <div style={{ 
            display: 'flex',
            overflowX: 'auto',
            gap: '15px',
            padding: '5px 0 20px 0',
            scrollSnapType: windowWidth < 768 ? 'x mandatory' : 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {days.map(day => (
              <div key={day} style={{ 
                minWidth: windowWidth < 768 ? '85%' : 'calc(14.28% - 13px)',
                scrollSnapAlign: windowWidth < 768 ? 'start' : 'none',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {/* Day Header */}
                <div style={{ 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: windowWidth < 768 ? '18px' : '16px',
                  textTransform: 'capitalize',
                  padding: '10px',
                  background: '#f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  {day}
                </div>

                {/* Meals for this day */}
                {mealTimes.map(time => {
                  const mealId = weeklyPlan[`${day}_${time}`]
                  const meal = getMealById(mealId)
                  return (
                    <div 
                      key={time} 
                      onClick={() => meal && handleMealClick(meal)}
                      style={{ 
                        marginBottom: '15px',
                        padding: '12px',
                        background: time === 'breakfast' ? '#fff4e6' :
                                   time === 'lunch' ? '#e6f3ff' : '#f0e6ff',
                        borderRadius: '8px',
                        cursor: meal ? 'pointer' : 'default',
                        transition: 'transform 0.2s',
                        border: meal ? '1px solid transparent' : '1px dashed #ccc',
                        opacity: meal ? 1 : 0.7
                      }}
                      onMouseEnter={(e) => {
                        if (meal) e.currentTarget.style.transform = 'scale(1.02)'
                      }}
                      onMouseLeave={(e) => {
                        if (meal) e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        textTransform: 'capitalize',
                        marginBottom: '8px',
                        color: '#666'
                      }}>
                        {time}
                      </div>
                      {meal ? (
                        <>
                          {/* Small meal image */}
                          <img 
                            src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
                            alt={meal.name}
                            style={{ 
                              width: '100%', 
                              height: windowWidth < 768 ? '100px' : '70px', 
                              objectFit: 'cover',
                              borderRadius: '6px',
                              marginBottom: '8px'
                            }}
                          />
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: windowWidth < 768 ? '15px' : '13px' 
                          }}>
                            {meal.name.length > (windowWidth < 768 ? 40 : 25) 
                              ? meal.name.substring(0, windowWidth < 768 ? 37 : 22) + '...' 
                              : meal.name}
                          </div>
                          <div style={{ 
                            fontSize: windowWidth < 768 ? '13px' : '11px', 
                            color: '#666', 
                            marginTop: '4px' 
                          }}>
                            🔥 {meal.calories} kcal
                          </div>
                          <div style={{ 
                            fontSize: windowWidth < 768 ? '12px' : '10px', 
                            color: '#999', 
                            marginTop: '4px' 
                          }}>
                            {meal.portion.length > (windowWidth < 768 ? 50 : 30) 
                              ? meal.portion.substring(0, windowWidth < 768 ? 47 : 27) + '...' 
                              : meal.portion}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#0070f3', 
                            marginTop: '8px',
                            textAlign: 'right'
                          }}>
                            Tap to view details →
                          </div>
                        </>
                      ) : (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#999', 
                          textAlign: 'center', 
                          padding: '20px 10px'
                        }}>
                          No meal assigned
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

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
          padding: '20px'
        }} onClick={() => setIsMealModalOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close button */}
            <button
              onClick={() => setIsMealModalOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'white',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 1
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
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}
            />

            {/* Meal Details */}
            <div style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: windowWidth < 768 ? '22px' : '24px' }}>
                {selectedMeal.name}
              </h2>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  background: '#e6f3ff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {selectedMeal.category}
                </span>
                <span style={{
                  background: '#fff4e6',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🔥 {selectedMeal.calories} kcal
                </span>
                {selectedMeal.prep_time && (
                  <span style={{
                    background: '#f0f0f0',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    ⏱️ {selectedMeal.prep_time}
                  </span>
                )}
              </div>

              {/* Portion */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#666' }}>
                  🍽️ Portion Advice
                </h3>
                <p style={{ margin: 0, fontSize: '16px' }}>{selectedMeal.portion}</p>
              </div>

              {/* Ingredients */}
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#666' }}>
                  🧺 Ingredients
                </h3>
                <div style={{ 
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  {selectedMeal.ingredients?.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < selectedMeal.ingredients.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <span style={{ fontWeight: '500' }}>{item.name}</span>
                      <span style={{ color: '#666' }}>{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button at bottom for mobile */}
              <button
                onClick={() => setIsMealModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '20px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}