import { useLanguageStore } from '@/stores/languageStore';
import { Languages } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'button';
}

export function LanguageToggle({ className = '', variant = 'pill' }: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  if (variant === 'button') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
          >
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{language.toUpperCase()}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{language === 'nl' ? 'Wissel naar Engels (EN)' : 'Switch to Dutch (NL)'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div 
      className={`inline-flex items-center rounded-full border border-border/80 bg-muted/50 p-0.5 text-[11px] font-semibold tracking-wide select-none ${className}`}
      role="group"
      aria-label="Taal selecteren"
    >
      <button
        type="button"
        onClick={() => setLanguage('nl')}
        className={`rounded-full px-2 py-0.5 transition-all duration-200 ${
          language === 'nl'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Nederlands"
      >
        NL
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-full px-2 py-0.5 transition-all duration-200 ${
          language === 'en'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
