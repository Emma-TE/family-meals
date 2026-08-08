'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { stitchTheme } from '../styles/stitchTheme'
import { toast } from 'sonner' 

// Components
import AddMealModal from './AddMealModal'
import EditMealModal from './EditMealModal'
import MealCard from './MealCard'
import CategoryFilter from './CategoryFilter'
import PageShell from './PageShell'

// Styles
import styles from '../page.module.css'

export default function HomeClient({ initialMeals, user, userRole }) {
  const [meals, setMeals] = useState(initialMeals)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  
  const supabase = createClient()

  async function handleDeleteMeal(mealId) {
    if (userRole !== 'admin') return
    
    if (confirm('Are you sure you want to delete this meal?')) {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
      
      if (error) {
        toast.error('Error deleting meal: ' + error.message)
      } else {
        toast.success('Meal deleted successfully!')
        setMeals(meals.filter(m => m.id !== mealId))
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

  const filteredMeals = meals.filter(meal => 
    (selectedCategory === 'all' || meal.category === selectedCategory) &&
    (searchQuery === '' || meal.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const categories = [
    { id: 'all', label: 'All Meals', icon: '🍽️' },
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🥘' },
    { id: 'dinner', label: 'Dinner', icon: '🍲' }
  ]

  return (
    <PageShell title="🍽️ Meal Library" active="library" user={user} userRole={userRole}>
          {/* Header with Add Button */}
          <div className={styles.headerRow}>
            <div>
              <h2 className={styles.title} style={{ color: stitchTheme.colors.onSurface }}>
                Our Meal Library
              </h2>
              <p className={styles.subtitle} style={{ color: stitchTheme.colors.onSurfaceVariant }}>
                {meals.length} delicious meals to choose from
              </p>
            </div>
            
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className={styles.addButton}
                style={{
                  background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                  color: stitchTheme.colors.onPrimary,
                  boxShadow: stitchTheme.shadows.md,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = stitchTheme.shadows.glow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = stitchTheme.shadows.md
                }}
              >
                <span>➕</span> Add New Meal
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="🔍 Search for a meal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                borderColor: stitchTheme.colors.outlineVariant,
                backgroundColor: stitchTheme.colors.surfaceContainerLowest,
                color: stitchTheme.colors.onSurface
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = stitchTheme.colors.primary
                e.currentTarget.style.boxShadow = `0 0 0 3px ${stitchTheme.colors.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = stitchTheme.colors.outlineVariant
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
          
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          {/* Meal Grid */}
          {meals.length === 0 ? (
            <div 
              className={styles.emptyState}
              style={{
                background: stitchTheme.colors.surfaceContainerLow,
                borderColor: stitchTheme.colors.outlineVariant
              }}
            >
              <div className={styles.emptyEmoji}>🍽️</div>
              <h3 style={{ color: stitchTheme.colors.onSurface, marginBottom: '8px' }}>
                No meals yet
              </h3>
              <p style={{ color: stitchTheme.colors.onSurfaceVariant, marginBottom: '24px' }}>
                Click &quot;Add New Meal&quot; to get started with your meal library!
              </p>
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={styles.addButton}
                  style={{
                    background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                    color: stitchTheme.colors.onPrimary,
                    margin: '0 auto',
                  }}
                >
                  ✨ Add Your First Meal
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredMeals.map((meal, index) => (
                <MealCard 
                  key={meal.id}
                  meal={meal}
                  index={index}
                  userRole={userRole}
                  onEdit={(mealToEdit) => {
                    setSelectedMeal(mealToEdit);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          )}

        {/* Modals */}
        <AddMealModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMealAdded={handleMealAdded}
        />

        <EditMealModal
          key={selectedMeal?.id || 'none'}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedMeal(null)
          }}
          meal={selectedMeal}
          onMealUpdated={handleMealUpdated}
        />
    </PageShell>
  )
}
