import React, { useState } from 'react';
import styles from './MealCard.module.css';
import { stitchTheme } from '../styles/stitchTheme';

export default function MealCard({ 
  meal, 
  index, 
  userRole, 
  onEdit, 
  onDelete 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥘';
      case 'dinner': return '🍲';
      default: return '🍽️';
    }
  };

  return (
    <div
      className={styles.cardWrapper}
      style={{
        animationDelay: `${index * 0.03}s`,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={styles.cardInner}
        style={{
          background: stitchTheme.colors.surface,
          boxShadow: isHovered ? stitchTheme.shadows.lg : stitchTheme.shadows.md,
          borderColor: stitchTheme.colors.outlineVariant,
        }}
      >
        {/* Image Area */}
        <div className={styles.imageContainer}>
          <img 
            src={meal.image_url || 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'} 
            alt={meal.name}
            className={styles.image}
            style={{
              transform: isHovered ? 'scale(1.08)' : 'scale(1)'
            }}
          />
          {/* Category Tag Overlay */}
          <div 
            className={styles.categoryTag}
            style={{
              background: stitchTheme.colors.surface,
              color: stitchTheme.colors.primary,
            }}
          >
            <span>{getCategoryIcon(meal.category)}</span>
            <span>{meal.category}</span>
          </div>
        </div>

        {/* Admin Controls */}
        {userRole === 'admin' && (
          <div className={styles.adminControls}>
            <button 
              onClick={() => onEdit(meal)}
              className={styles.adminButton}
              style={{
                background: stitchTheme.colors.surface,
                color: stitchTheme.colors.primary,
                boxShadow: stitchTheme.shadows.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.primary;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.surface;
                e.currentTarget.style.color = stitchTheme.colors.primary;
              }}
            >
              ✏️
            </button>
            <button 
              onClick={() => onDelete(meal.id)}
              className={styles.adminButton}
              style={{
                background: stitchTheme.colors.surface,
                color: stitchTheme.colors.error,
                boxShadow: stitchTheme.shadows.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.error;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = stitchTheme.colors.surface;
                e.currentTarget.style.color = stitchTheme.colors.error;
              }}
            >
              🗑️
            </button>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          <h3 
            className={styles.title}
            style={{ color: stitchTheme.colors.onSurface }}
          >
            {meal.name}
          </h3>
          
          <div className={styles.tagsContainer}>
            <span 
              className={styles.tag}
              style={{
                background: `${stitchTheme.colors.secondary}10`,
                color: stitchTheme.colors.secondary,
              }}
            >
              🔥 {meal.calories} kcal
            </span>
            {meal.prep_time && (
              <span 
                className={styles.tag}
                style={{
                  background: `${stitchTheme.colors.tertiary}10`,
                  color: stitchTheme.colors.tertiary,
                }}
              >
                ⏱️ {meal.prep_time}
              </span>
            )}
          </div>

          <p 
            className={styles.portion}
            style={{ color: stitchTheme.colors.onSurfaceVariant }}
          >
            <strong>Portion:</strong> {meal.portion}
          </p>

          <details className={styles.details}>
            <summary 
              className={styles.summary}
              style={{
                color: stitchTheme.colors.primary,
                background: `${stitchTheme.colors.primary}05`,
              }}
            >
              📋 View Ingredients
            </summary>
            <ul 
              className={styles.ingredientList}
              style={{ color: stitchTheme.colors.onSurfaceVariant }}
            >
              {meal.ingredients?.map((item, index) => (
                <li 
                  key={index} 
                  className={styles.ingredientItem}
                  style={{
                    borderBottom: index < meal.ingredients.length - 1 ? `1px solid ${stitchTheme.colors.outlineVariant}` : 'none',
                  }}
                >
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
  );
}
