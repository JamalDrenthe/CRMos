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
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
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
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
  { title: 'Settings', href: '/settings', icon: Settings },
];

function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const location = useLocation();
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
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.title}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
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
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                      isActive && 'bg-accent font-medium'
                    )
                  }
                >
                  <child.icon className="h-4 w-4" />
                  <span>{child.title}</span>
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
            <NavLink to={item.href}>
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-10 w-10', isActive && 'bg-accent')}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              )}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
          isActive && 'bg-accent font-medium'
        )
      }
    >
      <item.icon className="h-5 w-5" />
      <span>{item.title}</span>
      {item.badge && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex h-screen flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold">JamCRM</span>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className={cn('space-y-1', isCollapsed ? 'px-2' : 'px-3')}>
            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}

            {/* Divider */}
            {!isCollapsed && (
              <div className="my-4 border-t" />
            )}

            {/* Enhanced Features */}
            {!isCollapsed && (
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                Enhanced
              </p>
            )}
            {enhancedNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}

            {/* Divider */}
            {!isCollapsed && (
              <div className="my-4 border-t" />
            )}

            {/* Admin */}
            {!isCollapsed && (
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                Admin
              </p>
            )}
            {adminNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>
        </ScrollArea>

        {/* Collapse Button */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn('w-full', isCollapsed && 'h-10 w-10 p-0')}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
