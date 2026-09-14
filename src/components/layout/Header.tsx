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
} from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { searchContacts, searchCompanies, searchDeals } = useCRMStore();
  const { activeCall } = useContactCenterStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    contacts: ReturnType<typeof searchContacts>;
    companies: ReturnType<typeof searchCompanies>;
    deals: ReturnType<typeof searchDeals>;
  }>({ contacts: [], companies: [], deals: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [notifications] = useState([
    { id: '1', title: 'New lead assigned', message: 'John Smith from Acme Corp', time: '5 min ago', read: false },
    { id: '2', title: 'Deal moved to negotiation', message: 'TechFlow - Team Plan', time: '1 hour ago', read: false },
    { id: '3', title: 'Meeting reminder', message: 'Product demo in 30 minutes', time: '2 hours ago', read: true },
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4">
      {/* Left side - Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts, companies, deals..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="hidden rounded border bg-muted px-1.5 text-xs font-medium sm:inline-block">
              <Command className="inline h-3 w-3" />K
            </kbd>
          </div>

          {/* Search Results Popover */}
          {showSearch && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              <ScrollArea className="max-h-80">
                {searchResults.contacts.length > 0 && (
                  <div className="p-2">
                    <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Contacts</p>
                    {searchResults.contacts.map((contact) => (
                      <button
                        key={contact.id}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          navigate(`/crm/contacts?id=${contact.id}`);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{contact.first_name[0]}{contact.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchResults.companies.length > 0 && (
                  <div className="border-t p-2">
                    <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Companies</p>
                    {searchResults.companies.map((company) => (
                      <button
                        key={company.id}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          navigate(`/crm/companies?id=${company.id}`);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <span className="text-sm font-bold text-primary">{company.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.industry}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.deals.length > 0 && (
                  <div className="border-t p-2">
                    <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Deals</p>
                    {searchResults.deals.map((deal) => (
                      <button
                        key={deal.id}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          navigate(`/crm/deals?id=${deal.id}`);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10">
                          <span className="text-sm font-bold text-green-500">$</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{deal.name}</p>
                          <p className="text-xs text-muted-foreground">${deal.value.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline">{deal.stage}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.contacts.length === 0 &&
                  searchResults.companies.length === 0 &&
                  searchResults.deals.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Active Call Indicator */}
        {activeCall && (
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
            <Phone className="h-4 w-4 animate-pulse text-green-500" />
            <span className="text-sm font-medium text-green-500">
              {Math.floor((Date.now() - new Date(activeCall.started_at).getTime()) / 1000 / 60)}:
              {String(Math.floor((Date.now() - new Date(activeCall.started_at).getTime()) / 1000 % 60)).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b p-3">
              <p className="font-semibold">Notifications</p>
              <Button variant="ghost" size="sm">Mark all read</Button>
            </div>
            <ScrollArea className="h-64">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 border-b p-3 last:border-0',
                    !notification.read && 'bg-accent/50'
                  )}
                >
                  <div className="mt-0.5">
                    {!notification.read ? (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
