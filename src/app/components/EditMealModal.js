'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { stitchTheme } from '../styles/stitchTheme'
import { toast } from 'sonner'
import styles from './Modal.module.css'

// Security Helper Functions
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.replace(/<[^>]*>/g, '').trim()
}
const validateCalories = (value) => {
  const num = parseInt(value)
  return !isNaN(num) && num >= 0 && num <= 5000
}
const validatePortion = (value) => /^[a-zA-Z0-9\s\-\+\/\(\)\.,%½⅓¼⅔¾]+$/.test(value)
const validateImageUrl = (url) => {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch { return false }
}
const validateIngredientName = (name) => /^[a-zA-Z0-9\s\-\'\.]+$/.test(name)
const validateIngredientQuantity = (quantity) => /^[a-zA-Z0-9\s\-\/\(\)\.,½⅓¼⅔¾ cups?|tbsp?|tsp?|g|kg|ml|L]+$/.test(quantity)

export default function EditMealModal({ isOpen, onClose, meal, onMealUpdated }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('breakfast')
  const [calories, setCalories] = useState('')
  const [portion, setPortion] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const sanitizedName = sanitizeInput(name)
    const sanitizedPortion = sanitizeInput(portion)

    if (!sanitizedName || sanitizedName.length > 100) { setError('Invalid meal name'); setLoading(false); return }
    if (!sanitizedPortion || !validatePortion(sanitizedPortion)) { setError('Invalid portion'); setLoading(false); return }
    if (!validateCalories(calories)) { setError('Invalid calories'); setLoading(false); return }

    const validIngredients = ingredients
      .filter(i => i.name.trim() && i.quantity.trim())
      .map(ing => ({ name: sanitizeInput(ing.name).slice(0, 100), quantity: sanitizeInput(ing.quantity).slice(0, 100) }))
    
    if (validIngredients.length === 0) { setError('Add an ingredient'); setLoading(false); return }

    try {
      const supabase = createClient()
      let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `meals/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          toast.error('Image upload failed: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('meal-images')
          .getPublicUrl(filePath)
          
        finalImageUrl = publicUrl
      }

      const updatedMeal = {
        name: sanitizedName, category, calories: parseInt(calories),
        portion: sanitizedPortion, prep_time: sanitizeInput(prepTime) || null,
        image_url: finalImageUrl,
        ingredients: validIngredients
      }

      const { data, error } = await supabase.from('meals').update(updatedMeal).eq('id', meal.id).select()
      setLoading(false)
      if (error) { toast.error(error.message); setError(error.message) }
      else {
        toast.success('Meal updated!')
        onMealUpdated(data[0])
        onClose()
      }
    } catch (err) { setLoading(false); setError(err.message) }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: stitchTheme.colors.surface, boxShadow: stitchTheme.shadows.xl }}>
        <div className={styles.header} style={{ backgroundColor: stitchTheme.colors.surface, borderColor: stitchTheme.colors.outlineVariant }}>
          <div>
            <div className={styles.subTitle} style={{ color: stitchTheme.colors.primary }}>Update Recipe</div>
            <h2 className={styles.title} style={{ color: stitchTheme.colors.onSurface }}>Edit Meal</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton} style={{ backgroundColor: stitchTheme.colors.surfaceContainer, color: stitchTheme.colors.onSurfaceVariant }}>✕</button>
        </div>

        <div className={styles.formContent}>
          {error && <div className={styles.errorBox} style={{ backgroundColor: stitchTheme.colors.errorContainer, color: stitchTheme.colors.onErrorContainer }}>⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Meal Name *</label>
              <input type="text" className={styles.textInput} value={name} onChange={(e) => setName(e.target.value)} required style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Category *</label>
              <div className={styles.categoryGrid}>
                {['breakfast', 'lunch', 'dinner'].map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} className={styles.categoryButton} style={{ borderColor: category === cat ? stitchTheme.colors.primary : stitchTheme.colors.outlineVariant, backgroundColor: category === cat ? `${stitchTheme.colors.primary}10` : 'transparent', color: category === cat ? stitchTheme.colors.primary : stitchTheme.colors.onSurfaceVariant }}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.gridStats}>
              <div>
                <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Calories *</label>
                <input type="number" className={styles.textInput} value={calories} onChange={(e) => setCalories(e.target.value)} required style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
              </div>
              <div>
                <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Prep Time</label>
                <input type="text" className={styles.textInput} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Portion Advice *</label>
              <input type="text" className={styles.textInput} value={portion} onChange={(e) => setPortion(e.target.value)} required style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Update Photo <span className={styles.helperText} style={{ color: stitchTheme.colors.onSurfaceVariant }}>(optional)</span></label>
              {imageUrl && !imageUrl.includes('unsplash.com') && <div style={{marginBottom: '8px', fontSize: '12px', color: stitchTheme.colors.primary}}>Custom photo exists. Pick a new one to replace it.</div>}
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className={styles.textInput} style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest, padding: '9px 16px' }} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} style={{ color: stitchTheme.colors.onSurface }}>Ingredients *</label>
              <div className={styles.ingredientsHeader}>
                <button type="button" onClick={() => setIngredients([...ingredients, { name: '', quantity: '' }])} className={styles.addIngredientBtn} style={{ backgroundColor: `${stitchTheme.colors.primary}10`, color: stitchTheme.colors.primary }}>+ Add</button>
              </div>
              <div className={styles.ingredientList}>
                {ingredients.map((ing, i) => (
                  <div key={i} className={styles.ingredientItem} style={{ backgroundColor: stitchTheme.colors.surfaceContainerLow }}>
                    <input type="text" placeholder="Name" value={ing.name} onChange={(e) => { const n = [...ingredients]; n[i].name = e.target.value; setIngredients(n) }} className={styles.ingredientInput} style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
                    <input type="text" placeholder="Quantity" value={ing.quantity} onChange={(e) => { const n = [...ingredients]; n[i].quantity = e.target.value; setIngredients(n) }} className={styles.ingredientInput} style={{ borderColor: stitchTheme.colors.outlineVariant, backgroundColor: stitchTheme.colors.surfaceContainerLowest }} />
                    {ingredients.length > 1 && <button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className={styles.ingredientRemove} style={{ color: stitchTheme.colors.onSurfaceVariant }}>✕</button>}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formActions} style={{ borderColor: stitchTheme.colors.outlineVariant }}>
              <button type="button" onClick={onClose} className={styles.btnSecondary} style={{ color: stitchTheme.colors.onSurfaceVariant, borderColor: stitchTheme.colors.outlineVariant }}>Cancel</button>
              <button type="submit" disabled={loading} className={styles.btnPrimary} style={{ background: loading ? '#ccc' : stitchTheme.colors.primary }}>{loading ? 'Updating...' : 'Update Meal'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}