'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from "next/image";
import styles from "./page.module.css";
import { supabase } from '../lib/supabase'
import AddMealModal from './components/AddMealModal'
import EditMealModal from './components/EditMealModal'

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

  // Show loading state while checking auth
  if (loading || !authChecked) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>🍽️</div>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading meal planner...</div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #0070f3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const filteredMeals = selectedCategory === 'all' 
    ? meals 
    : meals.filter(meal => meal.category === selectedCategory)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Header - Mobile Responsive */}
        <div style={{ 
          display: 'flex', 
          flexDirection: windowWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: windowWidth < 768 ? 'flex-start' : 'center',
          width: '100%',
          padding: '20px',
          borderBottom: '1px solid #eee',
          gap: '10px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: windowWidth < 768 ? 'column' : 'row',
            alignItems: windowWidth < 768 ? 'flex-start' : 'center',
            gap: '10px',
            width: windowWidth < 768 ? '100%' : 'auto'
          }}>
            <h1 style={{ margin: 0, fontSize: windowWidth < 768 ? '20px' : '24px' }}>
              🍽️ Meal Planner
            </h1>
            <Link href="/weekly" style={{
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '16px',
              whiteSpace: 'nowrap'
            }}>
              📅 Weekly Plan →
            </Link>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            flexWrap: 'wrap',
            width: windowWidth < 768 ? '100%' : 'auto',
            justifyContent: windowWidth < 768 ? 'space-between' : 'flex-end'
          }}>
            <span style={{ 
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: windowWidth < 768 ? '150px' : '200px'
            }}>
              {user?.email}
              {userRole === 'admin' && (
                <span style={{ 
                  marginLeft: '8px', 
                  background: '#0070f3', 
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap'
                }}>
                  Admin
                </span>
              )}
            </span>
            <button onClick={() => supabase.auth.signOut()} style={{
              padding: '5px 10px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>Our Meal Library ({meals.length} meals)</h2>
            
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                + Add New Meal
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => setSelectedCategory('all')}
              style={{
                background: selectedCategory === 'all' ? '#0070f3' : '#f0f0f0',
                color: selectedCategory === 'all' ? 'white' : 'black',
                border: 'none',
                padding: '8px 16px',
                marginRight: '10px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button 
              onClick={() => setSelectedCategory('breakfast')}
              style={{
                background: selectedCategory === 'breakfast' ? '#0070f3' : '#f0f0f0',
                color: selectedCategory === 'breakfast' ? 'white' : 'black',
                border: 'none',
                padding: '8px 16px',
                marginRight: '10px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              Breakfast
            </button>
            <button 
              onClick={() => setSelectedCategory('lunch')}
              style={{
                background: selectedCategory === 'lunch' ? '#0070f3' : '#f0f0f0',
                color: selectedCategory === 'lunch' ? 'white' : 'black',
                border: 'none',
                padding: '8px 16px',
                marginRight: '10px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              Lunch
            </button>
            <button 
              onClick={() => setSelectedCategory('dinner')}
              style={{
                background: selectedCategory === 'dinner' ? '#0070f3' : '#f0f0f0',
                color: selectedCategory === 'dinner' ? 'white' : 'black',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              Dinner
            </button>
          </div>

          {/* Meal Grid */}
          {meals.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                No meals yet. Click "Add New Meal" to get started!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredMeals.map(meal => (
                <div key={meal.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'white',
                  position: 'relative'
                }}>
                  {userRole === 'admin' && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      display: 'flex',
                      gap: '5px',
                      zIndex: 1
                    }}>
                      <button 
                        onClick={() => {
                          setSelectedMeal(meal)
                          setIsEditModalOpen(true)
                        }}
                        style={{
                          background: '#0070f3',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteMeal(meal.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  
                  <img 
                    src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
                    alt={meal.name}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '15px' }}>
                    <h3>{meal.name}</h3>
                    <p><strong>Category:</strong> {meal.category}</p>
                    <p><strong>Calories:</strong> ~{meal.calories} kcal</p>
                    <p><strong>Portion:</strong> {meal.portion}</p>
                    <p><strong>Prep time:</strong> {meal.prep_time}</p>
                    
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#0070f3' }}>View Ingredients</summary>
                      <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                        {meal.ingredients?.map((item, index) => (
                          <li key={index}>{item.name} — {item.quantity}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
      </main>
    </div>
  )
}