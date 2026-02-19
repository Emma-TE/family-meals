'use client'

import Image from "next/image";
import styles from "./page.module.css";
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meals, setMeals] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/auth/login')
      } else {
        // Fetch user role
        await fetchUserRole(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/auth/login')
      } else {
        await fetchUserRole(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function fetchUserRole(userId) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
    } else {
      setUserRole(data?.role || 'viewer')
    }
  }

  useEffect(() => {
    // Fetch meals when user is logged in
    if (user) {
      fetchMeals()
    }
  }, [user])

  async function fetchMeals() {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('category')
    
    if (error) {
      console.error('Error fetching meals:', error)
    } else {
      setMeals(data)
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
        // Refresh meals list
        fetchMeals()
      }
    }
  }

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
  }

  if (!user) {
    return null
  }

  // Filter meals by category
  const filteredMeals = selectedCategory === 'all' 
    ? meals 
    : meals.filter(meal => meal.category === selectedCategory)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          padding: '20px',
          borderBottom: '1px solid #eee'
        }}>
          <h1>🍽️ Family Meal Planner</h1>
          <div>
            <span style={{ marginRight: '15px' }}>
              {user.email} 
              {userRole === 'admin' && <span style={{ 
                marginLeft: '8px', 
                background: '#0070f3', 
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>Admin</span>}
            </span>
            <button onClick={() => supabase.auth.signOut()}>
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
            
            {/* Admin Only - Add Meal Button */}
            {userRole === 'admin' && (
              <button style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
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
                {/* Admin Controls - Only visible to admin */}
                {userRole === 'admin' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '5px'
                  }}>
                    <button style={{
                      background: '#0070f3',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
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
                      {meal.ingredients.map((item, index) => (
                        <li key={index}>{item.name} — {item.quantity}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}