import { useState, ReactNode } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparkleOnClickProps {
  children: ReactNode;
  className?: string;
}

export function SparkleOnClick({ children, className = '' }: SparkleOnClickProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const handleClick = () => {
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 120,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3,
    }));
    
    setSparkles(prev => [...prev, ...newSparkles]);
    
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.some(ns => ns.id === s.id)));
    }, 1000);
  };

  return (
    <div className={`relative ${className}`} onClick={handleClick}>
      {children}
      {sparkles.map(sparkle => (
        <span
          key={sparkle.id}
          className="sparkle-particle"
          style={{
            '--sparkle-x': `${sparkle.x}px`,
            '--sparkle-y': `${sparkle.y}px`,
            '--sparkle-size': `${sparkle.size}px`,
            '--sparkle-delay': `${sparkle.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
