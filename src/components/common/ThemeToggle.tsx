import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ThemeToggleProps {
  className?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { language } = useLanguageStore();

  const isDark = theme === 'dark';
  const label = isDark 
    ? (language === 'nl' ? 'Schakel naar lichte modus' : 'Switch to light mode')
    : (language === 'nl' ? 'Schakel naar donkere modus' : 'Switch to dark mode');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={toggleTheme}
          aria-label={label}
          className={`relative h-9 w-9 rounded-full transition-transform active:scale-95 ${className || ''}`}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
