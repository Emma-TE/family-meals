import React, { useState } from 'react';
import styles from './CategoryFilter.module.css';
import { stitchTheme } from '../styles/stitchTheme';

export default function CategoryFilter({ categories, selectedCategory, setSelectedCategory }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  return (
    <div 
      className={styles.container}
      style={{ background: stitchTheme.colors.surfaceContainerLow }}
    >
      {categories.map(cat => {
        const isSelected = selectedCategory === cat.id;
        const isHovered = hoveredCategory === cat.id;

        let background = 'transparent';
        if (isSelected) {
          background = `linear-gradient(135deg, ${stitchTheme.colors.primary} 0%, ${stitchTheme.colors.primaryContainer} 100%)`;
        } else if (isHovered) {
          background = `${stitchTheme.colors.primary}10`;
        }

        return (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={styles.button}
            style={{
              background,
              color: isSelected ? stitchTheme.colors.onPrimary : stitchTheme.colors.onSurfaceVariant,
            }}
            onMouseEnter={() => setHoveredCategory(cat.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        );
      })}
    </div>
  );
}
