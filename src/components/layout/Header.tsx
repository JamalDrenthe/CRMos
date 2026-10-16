import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { useCRMStore } from '@/stores/crmStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  Phone,
  CheckCircle2,
  Command,
  Cloud,
  CloudOff,
  Menu,
  Blocks,
  Building2,
  Database,
  ChevronRight,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from '@/stores/languageStore';
import { isCoreEcosystemCompany } from '@/types';
import { CORE_PARTNER_OPTIONS } from '@/lib/companyAccess';
import { toast } from 'sonner';

interface HeaderProps {
  onOpenSearch?: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ onOpenSearch, onToggleMobileMenu }: HeaderProps = {}) {
  const navigate = useNavigate();
  const { user, organization, logout, adminCompanyFilter, setAdminCompanyFilter } = useAuthStore();
  const { searchContacts, searchCompanies, searchDeals, companies } = useCRMStore();
  const { activeCall } = useContactCenterStore();
  const { t } = useTranslation();

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const userCompanyName = user?.company_name || organization?.name || 'CRMos';
  const isCorePartner = isCoreEcosystemCompany(userCompanyName);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    contacts: ReturnType<typeof searchContacts>;
    companies: ReturnType<typeof searchCompanies>;
    deals: ReturnType<typeof searchDeals>;
  }>({ contacts: [], companies: [], deals: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [notifications] = useState([
    { id: '1', title: 'Nieuwe lead toegewezen', message: 'Daan van Vliet - Singel 240', time: '5 min geleden', read: false },
    { id: '2', title: 'Deal status gewijzigd', message: 'Q4 Glasvezel pilot gesloten', time: '1 uur geleden', read: false },
    { id: '3', title: 'Terugbelherinnering', message: 'Rotterdam Logistics nabellen om 14:00', time: '2 uur geleden', read: true },
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults({
        contacts: searchContacts(query).slice(0, 5),
        companies: searchCompanies(query).slice(0, 3),
        deals: searchDeals(query).slice(0, 3),
      });
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('Log out') + ' succesvol');
      navigate('/login');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-3 sm:px-6 transition-all">
      {/* Left side - Mobile Hamburger + Search */}
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        {/* Mobile Sidebar Hamburger Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileMenu}
          className="md:hidden h-9 w-9 rounded-full text-foreground hover:bg-muted shrink-0"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global Spotlight Search Trigger */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Search contacts, companies, deals...')}
            className="pl-10 pr-12 h-9 rounded-full text-xs bg-muted/40 border-border/60"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-pointer focus:outline-none"
              title="Global Spotlight Search (Cmd + K)"
            >
              <kbd className="hidden rounded border bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block hover:text-foreground transition-colors">
                <Command className="inline h-2.5 w-2.5 mr-0.5" />K
              </kbd>
            </button>
          </div>

          {/* Search Results Popover */}
          {showSearch && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-2xl border bg-popover/95 backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in">
              <ScrollArea className="max-h-80">
                {searchResults.contacts.length > 0 && (
                  <div className="p-2">
                    <p className="mb-1 px-2 text-[11px] font-semibold text-muted-foreground uppercase">Contacten</p>
                    {searchResults.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent cursor-pointer transition-colors text-xs"
                        onClick={() => {
                          navigate('/crm/contacts');
                          setShowSearch(false);
                        }}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="text-[10px]">{contact.first_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{contact.first_name} {contact.last_name}</p>
                          <p className="text-[11px] text-muted-foreground">{contact.company || contact.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.deals.length > 0 && (
                  <div className="p-2 border-t">
                    <p className="mb-1 px-2 text-[11px] font-semibold text-muted-foreground uppercase">Deals</p>
                    {searchResults.deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-accent cursor-pointer transition-colors text-xs"
                        onClick={() => {
                          navigate('/crm/deals');
                          setShowSearch(false);
                        }}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{deal.name}</p>
                          <p className="text-[11px] text-muted-foreground">{deal.company_name}</p>
                        </div>
                        <span className="font-bold text-primary">€{deal.value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Mobile Search Icon Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="sm:hidden h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          title="Zoeken"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Right side - Actions & Account Centrum */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Company Switcher for Admin OR Company Badge for Users */}
        {isSuperAdmin ? (
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border/80 rounded-full px-2.5 py-1 text-xs">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={adminCompanyFilter}
                onChange={(e) => setAdminCompanyFilter(e.target.value)}
                className="bg-transparent border-none text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
                title="Admin Bedrijfsfilter: Wissel weergave tussen bedrijven of bekijk alle data"
              >
                <option value="all">🏢 Alle Bedrijven (Admin Masterview)</option>
                <option value="crmos_core">✨ CRMos Core Ecosysteem</option>
                {CORE_PARTNER_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {companies
                  .filter((c) => !CORE_PARTNER_OPTIONS.includes(c.name as (typeof CORE_PARTNER_OPTIONS)[number]))
                  .map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-semibold text-[11px] max-w-[120px] truncate">{userCompanyName}</span>
            {isCorePartner && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Core
              </Badge>
            )}
          </div>
        )}

        {/* Firestore Status Badge (Hidden on smallest mobile screens to save space) */}
        {isFirebaseConfigured() ? (
          <div 
            title="Cloud Firestore is verbonden en actief"
            className="hidden lg:flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Cloud className="h-3 w-3" />
            <span className="text-[11px]">Firestore Live</span>
          </div>
        ) : (
          <div 
            title="Lokale demomodus actief."
            className="hidden lg:flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
          >
            <CloudOff className="h-3 w-3" />
            <span className="text-[11px]">Demo Opslag</span>
          </div>
        )}

        {/* Active Call Indicator */}
        {activeCall && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
            <Phone className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500">
              {Math.floor((Date.now() - new Date(activeCall.started_at).getTime()) / 1000 / 60)}:
              {String(Math.floor((Date.now() - new Date(activeCall.started_at).getTime()) / 1000 % 60)).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Language & Theme Controls (Hidden on mobile header, available in Account Menu on mobile) */}
        <div className="hidden sm:flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-border/60 bg-popover/95 backdrop-blur-xl" align="end">
            <div className="flex items-center justify-between border-b border-border/50 p-3.5">
              <p className="font-semibold text-xs sm:text-sm">{t('Notifications')}</p>
              <Button variant="ghost" size="sm" className="text-xs h-7">{t('Mark all read')}</Button>
            </div>
            <ScrollArea className="h-64">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 border-b border-border/30 p-3 last:border-0 text-xs transition-colors',
                    !n.read && 'bg-primary/5'
                  )}
                >
                  <div className="mt-1">
                    {!n.read ? (
                      <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/80">{n.time}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* ===================================================================== */}
        {/* APPLE-STYLE ACCOUNT CENTRUM DROPDOWN / POPOVER */}
        {/* ===================================================================== */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-border/60 hover:border-primary/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user?.name?.charAt(0) || 'J'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          {/* Quick Direct Logout Button in Header Bar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title={t('Log out')}
          >
            <LogOut className="h-4 w-4" />
          </Button>

          <DropdownMenuContent
            className="w-72 sm:w-80 p-2.5 rounded-3xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl"
            align="end"
            forceMount
          >
            {/* Header User Card (Apple ID Style) */}
            <DropdownMenuLabel className="p-2 mb-1">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border/60 shadow-xs">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {user?.name?.charAt(0) || 'J'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-foreground truncate">
                      {user?.name || 'Jamal Drenthe'}
                    </p>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary uppercase font-bold border-primary/20 shrink-0">
                      {user?.role || 'admin'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'info@jamaldrenthe.com'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-medium text-foreground truncate">
                      {userCompanyName}
                    </span>
                    {isCorePartner ? (
                      <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20 shrink-0">
                        Ecosysteem
                      </span>
                    ) : (
                      <span className="text-[9px] px-1 rounded bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20 shrink-0">
                        Geïsoleerd
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1.5" />

            {/* Account Centrum Quick Actions */}
            <div className="space-y-0.5 text-xs">
              <DropdownMenuItem
                onClick={() => navigate('/settings?tab=profile')}
                className="rounded-xl py-2 px-2.5 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Mijn Profiel</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>

              {/* INTEGRATIES PILL - 9 OFFICIAL INTEGRATIONS */}
              <DropdownMenuItem
                onClick={() => navigate('/settings?tab=integrations')}
                className="rounded-xl py-2 px-2.5 cursor-pointer flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Blocks className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Integraties</span>
                </div>
                <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold">
                  9 Partners
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/settings?tab=organization')}
                className="rounded-xl py-2 px-2.5 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Organisatie &amp; Teams</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/settings?tab=data')}
                className="rounded-xl py-2 px-2.5 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data &amp; Cloud Sync</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold">Live</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="rounded-xl py-2 px-2.5 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Account Centrum</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            </div>

            {/* Mobile inline Theme and Language selectors */}
            <div className="sm:hidden border-t border-border/40 my-1.5 pt-1.5 flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground">Voorkeuren:</span>
              <div className="flex items-center gap-1">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>

            <DropdownMenuSeparator className="my-1.5" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl py-2 px-2.5 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 focus:text-red-500 focus:bg-red-500/10 text-xs font-semibold"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('Log out')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
