import { cn } from '@/lib/utils';

interface GlowProps {
  className?: string;
  color?: 'brand' | 'red' | 'orange' | 'blue' | 'green';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const colorMap = {
  brand:  'bg-violet-600',
  red:    'bg-red-600',
  orange: 'bg-orange-600',
  blue:   'bg-blue-600',
  green:  'bg-emerald-600',
};

const sizeMap = {
  sm:  'w-48 h-48 blur-[80px]',
  md:  'w-72 h-72 blur-[100px]',
  lg:  'w-[500px] h-[500px] blur-[120px]',
  xl:  'w-[800px] h-[800px] blur-[160px]',
};

export function Glow({ className, color = 'brand', size = 'md' }: GlowProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full opacity-20 animate-glow-pulse',
        colorMap[color],
        sizeMap[size],
        className
      )}
    />
  );
}
