import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Phone,
  Target,
  Trophy,
  MapPin,
  Workflow,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCircle,
  FileText,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Shield,
  Blocks,
  X,
} from 'lucide-react';
import { useTranslation } from '@/stores/languageStore';
import { CRMosLogo } from '@/components/common/CRMosLogo';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    title: 'CRM',
    href: '/crm',
    icon: Users,
    children: [
      { title: 'Contacts', href: '/crm/contacts', icon: UserCircle },
      { title: 'Companies', href: '/crm/companies', icon: Building2 },
      { title: 'Deals', href: '/crm/deals', icon: Briefcase },
      { title: 'Activities', href: '/crm/activities', icon: ClipboardList },
    ],
  },
  {
    title: 'Recruitment',
    href: '/recruitment',
    icon: GraduationCap,
    children: [
      { title: 'Candidates', href: '/recruitment/candidates', icon: Users },
      { title: 'Jobs', href: '/recruitment/jobs', icon: FileText },
    ],
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: Target,
    children: [
      { title: 'Quotes', href: '/sales/quotes', icon: FileText },
      { title: 'Products', href: '/sales/products', icon: Briefcase },
    ],
  },
  {
    title: 'Contact Center',
    href: '/contact-center',
    icon: Phone,
    children: [
      { title: 'Agent Workspace', href: '/contact-center/workspace', icon: Phone },
      { title: 'Campaigns', href: '/contact-center/campaigns', icon: Target },
      { title: 'Pitch Flows', href: '/contact-center/pitch-flows', icon: MessageSquare },
    ],
  },
];

const enhancedNavItems: NavItem[] = [
  { title: '360° View', href: '/360-view', icon: UserCircle },
  { title: 'Gamification', href: '/gamification', icon: Trophy },
  { title: 'Territories', href: '/territories', icon: MapPin },
  { title: 'Workflows', href: '/workflows', icon: Workflow },
  { title: 'Dashboard Builder', href: '/dashboard-builder', icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { title: 'Integraties', href: '/integrations', icon: Blocks, badge: 9 },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
  { title: 'Settings', href: '/settings', icon: Settings },
];

function NavItemComponent({
  item,
  isCollapsed,
  onNavigate,
}: {
  item: NavItem;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  const [isOpen, setIsOpen] = useState(isActive);

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between',
              isCollapsed ? 'h-10 w-10 p-0' : 'px-3',
              isActive && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{t(item.title)}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown className={cn('h-4 w-4 transition-transform shrink-0', isOpen && 'rotate-180')} />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1 border-l pl-3">
              {item.children?.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm transition-colors hover:bg-accent',
                      isActive && 'bg-accent font-semibold text-primary'
                    )
                  }
                >
                  <child.icon className="h-4 w-4 shrink-0" />
                  <span>{t(child.title)}</span>
                </NavLink>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to={item.href} onClick={onNavigate}>
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-10 w-10 rounded-xl', isActive && 'bg-accent text-primary')}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                </Button>
              )}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{t(item.title)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm transition-colors hover:bg-accent',
          isActive && 'bg-accent font-semibold text-primary'
        )
      }
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span>{t(item.title)}</span>
      {item.badge !== undefined && (
        <span className="ml-auto flex h-5 px-1.5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const { t } = useTranslation();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo & Mobile Close */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <NavLink to="/" onClick={onCloseMobile} className="flex items-center gap-2">
          <CRMosLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
        </NavLink>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="md:hidden h-8 w-8 rounded-full"
            title="Sluiten"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 py-4">
        <div className={cn('space-y-1', isCollapsed ? 'px-2' : 'px-3')}>
          {/* Main Navigation */}
          {mainNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              onNavigate={onCloseMobile}
            />
          ))}

          {/* Divider */}
          {!isCollapsed && <div className="my-4 border-t border-border/50" />}

          {/* Enhanced Features */}
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Enhanced')}
            </p>
          )}
          {enhancedNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              onNavigate={onCloseMobile}
            />
          ))}

          {/* Divider */}
          {!isCollapsed && <div className="my-4 border-t border-border/50" />}

          {/* Admin & Integrations */}
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('Admin')} &amp; Beheer
            </p>
          )}
          {adminNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              onNavigate={onCloseMobile}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Desktop Collapse Button */}
      <div className="hidden md:block border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn('w-full rounded-xl', isCollapsed && 'h-10 w-10 p-0')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
              <span>{t('Collapse')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card transition-all duration-300 z-30 shrink-0',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sliding Panel */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dark Frosted Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-out Sidebar Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
