import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Briefcase, DollarSign, Building2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import type { Contact, Job, Deal, Company } from '@/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  type: 'contact' | 'job' | 'deal' | 'company';
  item: Contact | Job | Deal | Company;
  title: string;
  subtitle: string;
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const { contacts, jobs, deals } = useAppStore();

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const input = document.getElementById('global-search-input');
        input?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search contacts
    contacts.forEach((contact) => {
      if (
        contact.first_name.toLowerCase().includes(searchTerm) ||
        contact.last_name.toLowerCase().includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm) ||
        contact.title?.toLowerCase().includes(searchTerm)
      ) {
        allResults.push({
          type: 'contact',
          item: contact,
          title: `${contact.first_name} ${contact.last_name}`,
          subtitle: contact.title || contact.email,
        });
      }
    });

    // Search jobs
    jobs.forEach((job) => {
      if (
        job.title.toLowerCase().includes(searchTerm) ||
        job.department.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm)
      ) {
        allResults.push({
          type: 'job',
          item: job,
          title: job.title,
          subtitle: `${job.department} • ${job.location}`,
        });
      }
    });

    // Search deals
    deals.forEach((deal) => {
      if (deal.name.toLowerCase().includes(searchTerm)) {
        allResults.push({
          type: 'deal',
          item: deal,
          title: deal.name,
          subtitle: `$${deal.value.toLocaleString()} • ${deal.stage}`,
        });
      }
    });

    return allResults.slice(0, 10);
  }, [query, contacts, jobs, deals]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return <User className="w-4 h-4" />;
      case 'job':
        return <Briefcase className="w-4 h-4" />;
      case 'deal':
        return <DollarSign className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-600';
      case 'job':
        return 'bg-purple-100 text-purple-600';
      case 'deal':
        return 'bg-green-100 text-green-600';
      case 'company':
        return 'bg-orange-100 text-orange-600';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates, contacts, deals, jobs..."
              className="flex-1 text-lg outline-none placeholder:text-slate-400"
            />
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase">
                  Results ({results.length})
                </div>
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.item.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${getIconBg(result.type)}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{result.title}</p>
                      <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-xs text-slate-400 capitalize">{result.type}</span>
                  </motion.button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="py-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No results found for "{query}"</p>
                <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-8 px-4">
                <p className="text-sm text-slate-500 mb-3">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Senior Developer', 'TechCorp', 'Product Manager'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                to select
              </span>
            </div>
            <span>Search across all modules</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
