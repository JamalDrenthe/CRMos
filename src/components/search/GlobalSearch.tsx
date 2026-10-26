import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Briefcase,
  Euro,
  Building2,
  Users,
  Phone,
  Tag,
  Sparkles,
  Crown,
  X,
} from 'lucide-react';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { formatCompanyTag } from '@/lib/companyAccess';
import {
  smartSearchContacts,
  smartSearchCompanies,
  smartSearchCandidates,
  isReferredByJamal,
} from '@/services/crmSearchEngine';
import type { Contact, Job, Deal, Company, Candidate } from '@/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  type: 'contact' | 'candidate' | 'company' | 'deal' | 'job';
  item: Contact | Candidate | Company | Deal | Job;
  title: string;
  subtitle: string;
  badges?: string[];
  teamInfo?: string;
  teamStatus?: 'active' | 'passive';
  isJamalRef?: boolean;
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { contacts, companies, deals } = useCRMStore();
  const { jobs, candidates } = useRecruitmentStore();

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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
      }, 60);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const allResults: SearchResult[] = [];

    // 1. Smart Search Contacts (Highest priority: includes names, 06-numbers, teams, active/passive, referrer, #bedrijfstags, vvc_tag)
    const matchedContacts = smartSearchContacts(contacts, query).slice(0, 10);
    matchedContacts.forEach((contact) => {
      const allTags = Array.from(
        new Set([
          ...(contact.vvc_tag ? [contact.vvc_tag] : []),
          ...(contact.company_tags || []),
          ...(contact.tags || []),
        ])
      ).slice(0, 4);

      const subtitleParts = [
        contact.phone || '',
        contact.email || '',
        contact.company || contact.title || '',
        contact.referred_by_name ? `Via ${contact.referred_by_name}` : '',
      ].filter(Boolean);

      allResults.push({
        type: 'contact',
        item: contact,
        title: `${contact.first_name} ${contact.last_name}`.trim(),
        subtitle: subtitleParts.join(' • '),
        badges: allTags,
        teamInfo: contact.team_name || 'Team Jamal Drenthe',
        teamStatus: contact.team_status || 'active',
        isJamalRef: Boolean(contact.can_start_team || isReferredByJamal(contact.referred_by_name)),
      });
    });

    // 2. Smart Search Companies
    const matchedCompanies = smartSearchCompanies(companies, query).slice(0, 5);
    matchedCompanies.forEach((company) => {
      const compTag = company.company_tag || formatCompanyTag(company.name);
      allResults.push({
        type: 'company',
        item: company,
        title: company.name,
        subtitle: `${compTag} • ${company.industry || company.domain || 'Bedrijf'}${
          company.address?.city ? ` • ${company.address.city}` : ''
        }`,
        badges: [compTag, ...(company.industry ? [company.industry] : [])],
      });
    });

    // 3. Smart Search Candidates
    const matchedCandidates = smartSearchCandidates(candidates, query).slice(0, 4);
    matchedCandidates.forEach((cand) => {
      allResults.push({
        type: 'candidate',
        item: cand,
        title: `${cand.first_name} ${cand.last_name}`.trim(),
        subtitle: `${cand.skills?.[0] || cand.source || 'Kandidaat'} • ${cand.phone || cand.email || ''}`,
        badges: [
          ...(cand.vvc_tag ? [cand.vvc_tag] : []),
          ...(cand.tags || []).slice(0, 2),
        ],
      });
    });

    // 4. Search Deals & Jobs
    const searchTerm = query.toLowerCase().trim();
    deals.forEach((deal) => {
      if (
        deal.name.toLowerCase().includes(searchTerm) ||
        deal.company_name?.toLowerCase().includes(searchTerm)
      ) {
        allResults.push({
          type: 'deal',
          item: deal,
          title: deal.name,
          subtitle: `€${deal.value.toLocaleString('nl-NL')} • ${deal.stage}`,
        });
      }
    });

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

    return allResults.slice(0, 16);
  }, [query, contacts, companies, candidates, deals, jobs]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return <User className="w-4 h-4" />;
      case 'candidate':
        return <Users className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'deal':
        return <Euro className="w-4 h-4" />;
      case 'job':
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return 'bg-primary/10 text-primary';
      case 'candidate':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
      case 'company':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
      case 'deal':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'job':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh] px-3"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-2xl bg-card text-foreground border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-primary shrink-0" />
            <input
              id="global-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam (Reyhan, Julius, Jayden, Deniz, Boas, Fawzan, Ricardo), 06-nummer, #tag, team..."
              className="flex-1 text-sm sm:text-base bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="px-2 py-1 bg-muted rounded-md text-[11px] font-mono font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[65vh] overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2 divide-y divide-border/40">
                <div className="px-4 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span> Beste Resultaten ({results.length})</span>
                  <span>Klik om volledig profiel &amp; tags te openen</span>
                </div>
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.item.id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                    onClick={() => {
                      onClose();
                      if (result.type === 'contact') {
                        navigate(`/crm/contacts?id=${result.item.id}`);
                      } else if (result.type === 'company') {
                        navigate(`/crm/companies?id=${result.item.id}`);
                      } else if (result.type === 'candidate') {
                        navigate(`/recruitment/candidates?id=${result.item.id}`);
                      } else if (result.type === 'deal') {
                        navigate('/crm/deals');
                      } else if (result.type === 'job') {
                        navigate('/recruitment/jobs');
                      }
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getIconBg(result.type)}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground truncate">{result.title}</p>
                        {result.teamInfo && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              result.teamStatus === 'active'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {result.teamInfo} ({result.teamStatus === 'active' ? 'Actief' : 'Passief'})
                          </span>
                        )}
                        {result.isJamalRef && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                            <Crown className="w-2.5 h-2.5" />
                            Door Jamal Drenthe
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        {result.type === 'contact' && (result.item as Contact).phone && (
                          <Phone className="w-3 h-3 text-emerald-500 shrink-0 inline" />
                        )}
                        <span>{result.subtitle}</span>
                      </p>

                      {result.badges && result.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {result.badges.map((b) => (
                            <span
                              key={b}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border/60"
                            >
                              <Tag className="w-2.5 h-2.5 text-amber-500" />
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted shrink-0">
                      {result.type === 'contact'
                        ? 'Contact'
                        : result.type === 'company'
                        ? 'Bedrijf'
                        : result.type === 'candidate'
                        ? 'Kandidaat'
                        : result.type}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  Geen resultaten gevonden voor "{query}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Probeer een voornaam, 06-nummer, #bedrijfstag of VVC-tag
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    7 Kernteamleiders (Aangeleverd door Jamal Drenthe)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Reyhan', 'Julius', 'Jayden', 'Deniz', 'Boas', 'Fawzan', 'Ricardo', 'Jamal Drenthe'].map(
                      (leader) => (
                        <button
                          key={leader}
                          onClick={() => setQuery(leader)}
                          className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/25 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
                        >
                          {leader}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Teams &amp; Bedrijfstags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Actief Team',
                      'Passief Team',
                      '#vvc',
                      '#spontiva',
                      '#investbotiq',
                      '#boostplug',
                      '#crmos',
                      '#quantum-initium',
                      '#woningvry',
                      '#xabi-world',
                    ].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 bg-muted rounded-full text-xs font-mono text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Zoekt op naam, 06/+316, e-mail, #bedrijfstag, VVC-tag, team &amp; aanbrenger</span>
            </div>
            <span className="font-semibold text-primary">CRMos Smart Search</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
