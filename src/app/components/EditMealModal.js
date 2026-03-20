'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { stitchTheme } from '../styles/stitchTheme'

// Security Helper Functions (same as Add modal)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.replace(/<[^>]*>/g, '').trim()
}

const validateCalories = (value) => {
  const num = parseInt(value)
  if (isNaN(num)) return false
  if (num < 0 || num > 5000) return false
  return true
}

const validatePortion = (value) => {
  const validPattern = /^[a-zA-Z0-9\s\-\+\/\(\)\.,%½⅓¼⅔¾]+$/
  return validPattern.test(value)
}

const validateImageUrl = (url) => {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const validateIngredientName = (name) => {
  const pattern = /^[a-zA-Z0-9\s\-\'\.]+$/
  return pattern.test(name)
}

const validateIngredientQuantity = (quantity) => {
  const pattern = /^[a-zA-Z0-9\s\-\/\(\)\.,½⅓¼⅔¾ cups?|tbsp?|tsp?|g|kg|ml|L]+$/
  return pattern.test(quantity)
}

export default function EditMealModal({ isOpen, onClose, meal, onMealUpdated }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('breakfast')
  const [calories, setCalories] = useState('')
  const [portion, setPortion] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

  // Load meal data when modal opens
  useEffect(() => {
    if (meal) {
      setName(meal.name || '')
      setCategory(meal.category || 'breakfast')
      setCalories(meal.calories?.toString() || '')
      setPortion(meal.portion || '')
      setPrepTime(meal.prep_time || '')
      setImageUrl(meal.image_url || '')
      setIngredients(meal.ingredients?.length ? meal.ingredients : [{ name: '', quantity: '' }])
    }
  }, [meal])

  if (!isOpen) return null

  const isMobile = windowWidth < 768

  const addIngredientField = () => {
    if (ingredients.length < 30) {
      setIngredients([...ingredients, { name: '', quantity: '' }])
    }
  }

  const removeIngredientField = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index)
    setIngredients(newIngredients)
  }

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Sanitize text inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedPortion = sanitizeInput(portion)
    const sanitizedPrepTime = sanitizeInput(prepTime)
    const sanitizedImageUrl = sanitizeInput(imageUrl)

    // Validate required fields
    if (!sanitizedName) {
      setError('Please enter a meal name')
      setLoading(false)
      return
    }

    if (sanitizedName.length > 100) {
      setError('Meal name is too long (max 100 characters)')
      setLoading(false)
      return
    }

    if (!sanitizedPortion) {
      setError('Please enter portion advice')
      setLoading(false)
      return
    }

    if (sanitizedPortion.length > 200) {
      setError('Portion advice is too long (max 200 characters)')
      setLoading(false)
      return
    }

    if (!validatePortion(sanitizedPortion)) {
      setError('Portion advice contains invalid characters. Use letters, numbers, and common punctuation only.')
      setLoading(false)
      return
    }

    if (!calories) {
      setError('Please enter calorie count')
      setLoading(false)
      return
    }

    if (!validateCalories(calories)) {
      setError('Please enter a valid calorie amount between 0 and 5000')
      setLoading(false)
      return
    }

    if (sanitizedPrepTime && sanitizedPrepTime.length > 50) {
      setError('Prep time is too long (max 50 characters)')
      setLoading(false)
      return
    }

    if (sanitizedImageUrl && !validateImageUrl(sanitizedImageUrl)) {
      setError('Please enter a valid image URL (must start with http:// or https://)')
      setLoading(false)
      return
    }

    // Sanitize and validate ingredients
    const validIngredients = ingredients
      .filter(i => i.name && i.name.trim() && i.quantity && i.quantity.trim())
      .map(ing => ({
        name: sanitizeInput(ing.name).slice(0, 100),
        quantity: sanitizeInput(ing.quantity).slice(0, 100)
      }))
    
    if (validIngredients.length === 0) {
      setError('Please add at least one ingredient')
      setLoading(false)
      return
    }

    for (const ing of validIngredients) {
      if (!validateIngredientName(ing.name)) {
        setError(`Invalid ingredient name: "${ing.name}". Use letters, numbers, and spaces only.`)
        setLoading(false)
        return
      }
      if (!validateIngredientQuantity(ing.quantity)) {
        setError(`Invalid quantity format: "${ing.quantity}". Use numbers and common units (cups, tbsp, tsp, g, kg)`)
        setLoading(false)
        return
      }
    }

    if (validIngredients.length > 30) {
      setError('Too many ingredients (max 30)')
      setLoading(false)
      return
    }

    const updatedMeal = {
      name: sanitizedName,
      category,
      calories: parseInt(calories),
      portion: sanitizedPortion,
      prep_time: sanitizedPrepTime || null,
      image_url: sanitizedImageUrl || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400',
      ingredients: validIngredients
    }

    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updatedMeal)
        .eq('id', meal.id)
        .select()

      setLoading(false)

      if (error) {
        setError('Error updating meal: ' + error.message)
      } else {
        onMealUpdated(data[0])
        onClose()
      }
    } catch (err) {
      setLoading(false)
      setError('Unexpected error: ' + err.message)
    }
  }

  const getCategoryIcon = () => {
    switch(category) {
      case 'breakfast': return '🍳'
      case 'lunch': return '🥘'
      case 'dinner': return '🍲'
      default: return '🍽️'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: stitchTheme.colors.surface,
          borderRadius: stitchTheme.borderRadius.xl,
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: stitchTheme.shadows.xl,
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: `1px solid ${stitchTheme.colors.outlineVariant}`,
          background: stitchTheme.colors.surface,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: stitchTheme.colors.primary,
                marginBottom: '4px'
              }}>
                Edit Recipe
              </div>
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '22px' : '24px',
                fontWeight: 700,
                color: stitchTheme.colors.onSurface,
                background: `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Update Meal
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: stitchTheme.colors.surfaceContainer,
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: stitchTheme.colors.onSurfaceVariant,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.error
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.surfaceContainer
                e.currentTarget.style.color = stitchTheme.colors.onSurfaceVariant
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: stitchTheme.colors.errorContainer,
              color: stitchTheme.colors.onErrorContainer,
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Meal Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '13px',
                color: stitchTheme.colors.onSurface
              }}>
                Meal Name <span style={{ color: stitchTheme.colors.error }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jollof Rice & Grilled Chicken"
                maxLength={100}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                  background: stitchTheme.colors.surfaceContainerLowest,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
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
              <div style={{ fontSize: '11px', color: stitchTheme.colors.onSurfaceVariant, marginTop: '4px' }}>
                {name.length}/100 characters
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '13px',
                color: stitchTheme.colors.onSurface
              }}>
                Category <span style={{ color: stitchTheme.colors.error }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {['breakfast', 'lunch', 'dinner'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '9999px',
                      border: `1px solid ${category === cat ? stitchTheme.colors.primary : stitchTheme.colors.outlineVariant}`,
                      background: category === cat ? `${stitchTheme.colors.primary}10` : 'transparent',
                      color: category === cat ? stitchTheme.colors.primary : stitchTheme.colors.onSurfaceVariant,
                      fontWeight: category === cat ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{cat === 'breakfast' ? '🍳' : cat === 'lunch' ? '🥘' : '🍲'}</span>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Calories */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: stitchTheme.colors.onSurface
                }}>
                  Calories <span style={{ color: stitchTheme.colors.error }}>*</span>
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 650"
                  min="0"
                  max="5000"
                  step="10"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                    background: stitchTheme.colors.surfaceContainerLowest,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s'
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
                <div style={{ fontSize: '11px', color: stitchTheme.colors.onSurfaceVariant, marginTop: '4px' }}>
                  0-5000 calories
                </div>
              </div>

              {/* Prep Time */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: stitchTheme.colors.onSurface
                }}>
                  Prep Time
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="e.g., 45 mins"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                    background: stitchTheme.colors.surfaceContainerLowest,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s'
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
            </div>

            {/* Portion */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '13px',
                color: stitchTheme.colors.onSurface
              }}>
                Portion Advice <span style={{ color: stitchTheme.colors.error }}>*</span>
              </label>
              <input
                type="text"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="e.g., 1½ cups rice + 1 chicken thigh"
                maxLength={200}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                  background: stitchTheme.colors.surfaceContainerLowest,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s'
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
              <div style={{ fontSize: '11px', color: stitchTheme.colors.onSurfaceVariant, marginTop: '4px' }}>
                {portion.length}/200 characters
              </div>
            </div>

            {/* Image URL */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '13px',
                color: stitchTheme.colors.onSurface
              }}>
                Image URL <span style={{ color: stitchTheme.colors.onSurfaceVariant, fontSize: '11px' }}>(optional)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/meal-photo.jpg"
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                  background: stitchTheme.colors.surfaceContainerLowest,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s'
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

            {/* Ingredients */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: stitchTheme.colors.onSurface
                }}>
                  Ingredients <span style={{ color: stitchTheme.colors.error }}>*</span>
                  <span style={{ fontSize: '11px', color: stitchTheme.colors.onSurfaceVariant, marginLeft: '8px' }}>
                    (max 30 items)
                  </span>
                </label>
                {ingredients.length < 30 && (
                  <button
                    type="button"
                    onClick={addIngredientField}
                    style={{
                      background: `${stitchTheme.colors.primary}10`,
                      color: stitchTheme.colors.primary,
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${stitchTheme.colors.primary}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${stitchTheme.colors.primary}10`
                    }}
                  >
                    <span>+</span> Add Ingredient
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ingredients.map((ingredient, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    alignItems: 'center',
                    background: stitchTheme.colors.surfaceContainerLow,
                    padding: '8px',
                    borderRadius: '12px'
                  }}>
                    <input
                      type="text"
                      placeholder="Ingredient name (e.g., Rice)"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      maxLength={100}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                        background: stitchTheme.colors.surfaceContainerLowest,
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = stitchTheme.colors.primary
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = stitchTheme.colors.outlineVariant
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Quantity (e.g., 300g, 2 cups)"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      maxLength={100}
                      style={{
                        flex: 0.8,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                        background: stitchTheme.colors.surfaceContainerLowest,
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = stitchTheme.colors.primary
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = stitchTheme.colors.outlineVariant
                      }}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredientField(index)}
                        style={{
                          background: 'transparent',
                          color: stitchTheme.colors.onSurfaceVariant,
                          border: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = stitchTheme.colors.errorContainer
                          e.currentTarget.style.color = stitchTheme.colors.error
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = stitchTheme.colors.onSurfaceVariant
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {ingredients.length >= 30 && (
                <div style={{ fontSize: '11px', color: stitchTheme.colors.error, marginTop: '8px' }}>
                  Maximum 30 ingredients reached
                </div>
              )}
            </div>

            {/* Form Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: `1px solid ${stitchTheme.colors.outlineVariant}`
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: stitchTheme.colors.onSurfaceVariant,
                  border: `1px solid ${stitchTheme.colors.outlineVariant}`,
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = stitchTheme.colors.surfaceContainer
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#ccc' : `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: stitchTheme.shadows.md,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = stitchTheme.shadows.glow
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = stitchTheme.shadows.md
                  }
                }}
              >
                {loading ? 'Updating...' : 'Update Meal'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}