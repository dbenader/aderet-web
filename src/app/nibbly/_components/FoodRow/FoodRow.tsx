'use client';

import { useEffect, useRef } from 'react';
import styles from './styles.module.scss';

interface Props {
  images: string[];
  direction: 'left' | 'right';
  rowHeight: number;          // px
  speed?: number;             // seconds for one full pass
}

export default function FoodRow({
  images,
  direction,
  rowHeight,
  speed = 50,
}: Props) {
  const railRef = useRef<HTMLDivElement>(null);

  // Inject per-row CSS variables
  useEffect(() => {
    if (!railRef.current) return;
    railRef.current.style.setProperty('--row-h', `${rowHeight}px`);
    railRef.current.style.setProperty('--row-dur', `${speed}s`);
    railRef.current.style.setProperty(
      '--row-dir',
      direction === 'left' ? 'normal' : 'reverse'
    );
  }, [rowHeight, speed, direction]);

  return (
    <div className={styles.wrapper}>
      <div ref={railRef} className={styles.rail}>
        {[0, 1].map((dup) => (
          <div key={dup} className={styles.track}>
            {images.map((src, i) => (
              <img key={`${dup}-${i}`} src={src} alt="" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
