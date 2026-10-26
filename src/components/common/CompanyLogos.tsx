import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, CheckCircle2, ArrowUpRight, Sparkles, Building2 } from 'lucide-react';
import { CRMosEmblem } from './CRMosLogo';

export type EcosystemCompanyId =
  | 'vvc'
  | 'quantum-initium'
  | 'immigratiepunt'
  | 'spontiva'
  | 'investbotiq'
  | 'boostplug'
  | 'crmos'
  | 'zheavenzy'
  | 'logs-rent'
  | 'djobba-works'
  | 'trusting-work'
  | 'woningvry'
  | 'xabi-world';

export interface EcosystemCompanyData {
  id: EcosystemCompanyId;
  name: string;
  shortName: string;
  tag: string;
  domain: string;
  website: string;
  industry: string;
  description: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  bgLight: string;
  category: 'Holding & AI' | 'Sales & Community' | 'Fintech & Growth' | 'HR & Werving' | 'Vastgoed & Logistiek';
}

export const ECOSYSTEM_COMPANIES: EcosystemCompanyData[] = [
  {
    id: 'vvc',
    name: 'VVC (Verdienende Vrienden Club)',
    shortName: 'VVC',
    tag: '#vvc',
    domain: 'verdienendevrienden.club',
    website: 'https://verdienendevrienden.club',
    industry: 'Sales Community & Netwerk',
    description: 'Exclusief netwerk voor high-ticket salestalent, referral incentives en gezamenlijke B2B dealmaking.',
    gradient: 'from-amber-500 via-amber-600 to-yellow-500',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
    category: 'Sales & Community',
  },
  {
    id: 'quantum-initium',
    name: 'Quantum Initium',
    shortName: 'Quantum Initium',
    tag: '#quantum-initium',
    domain: 'quantuminitium.com',
    website: 'https://quantuminitium.com',
    industry: 'Venture Building & AI Holding',
    description: 'Venture holding gespecialiseerd in deep tech, AI agents en schaalbare autonome enterprise software.',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-500/10',
    category: 'Holding & AI',
  },
  {
    id: 'immigratiepunt',
    name: 'Immigratiepunt',
    shortName: 'Immigratiepunt',
    tag: '#immigratiepunt',
    domain: 'immigratiepunt.nl',
    website: 'https://immigratiepunt.nl',
    industry: 'Juridische Dienstverlening & Immigratie',
    description: 'Specialist in kennismigranten, internationale relocatie, IND-aanvragen en expat compliance.',
    gradient: 'from-blue-600 via-cyan-600 to-sky-500',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgLight: 'bg-sky-500/10',
    category: 'HR & Werving',
  },
  {
    id: 'spontiva',
    name: 'Spontiva',
    shortName: 'Spontiva',
    tag: '#spontiva',
    domain: 'spontiva.com',
    website: 'https://spontiva.com',
    industry: 'Commerciële Groei & Outsourcing',
    description: 'Outsourced sales engines, leadconversie en schaalbare commerciële slagkracht voor snelle groeiers.',
    gradient: 'from-orange-500 via-red-500 to-amber-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgLight: 'bg-orange-500/10',
    category: 'Sales & Community',
  },
  {
    id: 'investbotiq',
    name: 'Investbotiq',
    shortName: 'Investbotiq',
    tag: '#investbotiq',
    domain: 'investbotiq.com',
    website: 'https://investbotiq.com',
    industry: 'Fintech & Automated Investing',
    description: 'Geavanceerde kwantitatieve modellen, automated liquidity en slimme kapitaalallocatie voor ondernemers.',
    gradient: 'from-emerald-500 via-teal-600 to-green-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    category: 'Fintech & Growth',
  },
  {
    id: 'boostplug',
    name: 'Boostplug',
    shortName: 'Boostplug',
    tag: '#boostplug',
    domain: 'boostplug.one',
    website: 'https://boostplug.one',
    industry: 'Growth Marketing & Performance',
    description: 'Hyper-gerichte B2B performance funnels, high-conversion landing engines en geautomatiseerde pipeline filling.',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgLight: 'bg-cyan-500/10',
    category: 'Fintech & Growth',
  },
  {
    id: 'crmos',
    name: 'CRMos',
    shortName: 'CRMos',
    tag: '#crmos',
    domain: 'crmos.one',
    website: 'https://crmos.one',
    industry: 'SaaS CRM, Field Sales & Recruitment',
    description: 'Het centrale besturingssysteem voor Field Sales, Telemarketing en Recruitment met realtime Firestore data.',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-500/10',
    category: 'Holding & AI',
  },
  {
    id: 'zheavenzy',
    name: 'Zheavenzy',
    shortName: 'Zheavenzy',
    tag: '#zheavenzy',
    domain: 'zheavenzy.com',
    website: 'https://zheavenzy.com',
    industry: 'E-Commerce & Lifestyle Brands',
    description: 'High-end design, luxury e-commerce labels en exclusieve agent incentives voor top performers.',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgLight: 'bg-pink-500/10',
    category: 'Sales & Community',
  },
  {
    id: 'logs-rent',
    name: 'Logs.rent',
    shortName: 'Logs.rent',
    tag: '#logs.rent',
    domain: 'logs.rent',
    website: 'https://logs.rent',
    industry: 'Logistiek, Verhuur & Materieel',
    description: 'Flexibel materieelbeheer, representatief verkoopwagenpark en geautomatiseerde hardware provisioning.',
    gradient: 'from-teal-500 via-emerald-600 to-teal-700',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    bgLight: 'bg-teal-500/10',
    category: 'Vastgoed & Logistiek',
  },
  {
    id: 'djobba-works',
    name: 'Djobba.works',
    shortName: 'Djobba.works',
    tag: '#djobba.works',
    domain: 'djobba.works',
    website: 'https://djobba.works',
    industry: 'Recruitment, Detachering & Flexwerk',
    description: 'Flexibele personeelsplanning, on-demand shift matching en directe koppeling aan commerciële teams.',
    gradient: 'from-rose-500 via-red-600 to-orange-500',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-500/10',
    category: 'HR & Werving',
  },
  {
    id: 'trusting-work',
    name: 'Trusting Work',
    shortName: 'Trusting Work',
    tag: '#trusting-work',
    domain: 'trustingwork.nl',
    website: 'https://trustingwork.nl',
    industry: 'HR, Arbeidsbemiddeling & Coaching',
    description: 'Integriteitsverificatie, digitale VOG-validaties en professionele loopbaanbegeleiding voor commercieel talent.',
    gradient: 'from-blue-600 via-indigo-700 to-slate-800',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgLight: 'bg-indigo-500/10',
    category: 'HR & Werving',
  },
  {
    id: 'woningvry',
    name: 'Woningvry',
    shortName: 'Woningvry',
    tag: '#woningvry',
    domain: 'woningvry.nl',
    website: 'https://woningvry.nl',
    industry: 'Vastgoed, Huisvesting & Verhuur',
    description: 'Zakelijke huisvesting voor buitenlandse professionals, vastgoedbemiddeling en flexibele residenties.',
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    category: 'Vastgoed & Logistiek',
  },
  {
    id: 'xabi-world',
    name: 'Xabi World',
    shortName: 'Xabi World',
    tag: '#xabi-world',
    domain: 'xabiworld.com',
    website: 'https://xabiworld.com',
    industry: 'International Commerce & Media',
    description: 'Internationale marktontsluiting, cross-border contentdistributie en wereldwijde consumentenbereik.',
    gradient: 'from-indigo-500 via-blue-600 to-violet-600',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgLight: 'bg-indigo-500/10',
    category: 'Holding & AI',
  },
];

/**
 * Authentic vector logo emblems for each of the 13 ecosystem companies
 */
export function CompanyLogoSvg({
  id,
  className = 'h-7 w-7',
}: {
  id: EcosystemCompanyId | string;
  className?: string;
}) {
  const normalized = id.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // CRMos uses the official branding
  if (normalized.includes('crmos')) {
    return (
      <div className={cn('relative shrink-0 rounded-xl overflow-hidden p-0.5 bg-[#09090b] flex items-center justify-center border border-white/10 shadow-sm', className)}>
        <CRMosEmblem className="w-full h-full drop-shadow-md" />
      </div>
    );
  }

  // VVC (Verdienende Vrienden Club) - Gold Crown Crest with connected nodes
  if (normalized.includes('vvc') || normalized.includes('verdienende')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="vvc-gold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.5" stopColor="#D97706" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="vvc-glow" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#1C1917" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" />
        <path
          d="M12 32L15 18L24 25L33 18L36 32H12Z"
          fill="url(#vvc-gold)"
        />
        <circle cx="15" cy="16" r="2.5" fill="#FDE68A" />
        <circle cx="24" cy="22" r="3" fill="#FFFBEB" />
        <circle cx="33" cy="16" r="2.5" fill="#FDE68A" />
        <path d="M16 35H32" stroke="url(#vvc-glow)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="30" r="1.5" fill="#FDE68A" />
      </svg>
    );
  }

  // Quantum Initium - Multi-dimensional crystal nexus orbital
  if (normalized.includes('quantum')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="qi-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0F0F1B" stroke="#8B5CF6" strokeWidth="1.5" strokeOpacity="0.4" />
        <ellipse cx="24" cy="24" rx="14" ry="5.5" transform="rotate(30 24 24)" stroke="#A78BFA" strokeWidth="1.75" />
        <ellipse cx="24" cy="24" rx="14" ry="5.5" transform="rotate(-30 24 24)" stroke="#818CF8" strokeWidth="1.75" />
        <circle cx="24" cy="24" r="4.5" fill="url(#qi-grad)" />
        <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
        <circle cx="13" cy="18" r="1.5" fill="#C4B5FD" />
        <circle cx="35" cy="30" r="1.5" fill="#C4B5FD" />
      </svg>
    );
  }

  // Immigratiepunt - Architectural portal & compass point
  if (normalized.includes('immigratie')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="imp-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284C7" />
            <stop offset="1" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0B132B" stroke="#0284C7" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M24 10L36 34H30L24 22L18 34H12L24 10Z" fill="url(#imp-grad)" />
        <circle cx="24" cy="18" r="2.5" fill="#38BDF8" />
        <path d="M19 38H29" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Spontiva - Energy burst and lightning surge
  if (normalized.includes('spontiva')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="spont-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="1" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#1C120C" stroke="#F97316" strokeWidth="1.5" strokeOpacity="0.4" />
        <path
          d="M26 10L14 26H23L21 38L34 22H24L26 10Z"
          fill="url(#spont-grad)"
          stroke="#FED7AA"
          strokeWidth="1"
        />
      </svg>
    );
  }

  // Investbotiq - Algorithmic neural finance nodes
  if (normalized.includes('investbotiq')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="ib-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#061A14" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Candlestick bars */}
        <line x1="15" y1="18" x2="15" y2="34" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <rect x="12" y="22" width="6" height="8" rx="1.5" fill="#10B981" />
        <line x1="24" y1="12" x2="24" y2="36" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <rect x="21" y="16" width="6" height="12" rx="1.5" fill="#10B981" />
        <line x1="33" y1="14" x2="33" y2="30" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
        <rect x="30" y="18" width="6" height="7" rx="1.5" fill="#10B981" />
        {/* Trend pulse curve */}
        <path d="M15 26L24 20L33 15" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="33" cy="15" r="2.5" fill="#ECFDF5" />
      </svg>
    );
  }

  // Boostplug - High-voltage hexagonal turbo plug
  if (normalized.includes('boostplug')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="bp-grad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#081726" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.4" />
        <path
          d="M24 12L34 18V30L24 36L14 30V18L24 12Z"
          fill="url(#bp-grad)"
          stroke="#67E8F9"
          strokeWidth="1.5"
        />
        <path d="M22 17L18 25H24L22 31L28 23H22L24 17H22Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // Zheavenzy - Luxury haute-couture diamond star monogram
  if (normalized.includes('zheavenzy')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="zh-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#1C0A19" stroke="#EC4899" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M24 10L35 24L24 38L13 24L24 10Z" fill="url(#zh-grad)" />
        <path d="M19 19H29L19 29H29" stroke="#FDF2F8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="1.5" fill="#FCE7F3" />
        <circle cx="24" cy="38" r="1.5" fill="#FCE7F3" />
      </svg>
    );
  }

  // Logs.rent - Isometric modular logistics freight cube
  if (normalized.includes('logs') || normalized.includes('rent')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="lr-top" x1="14" y1="12" x2="34" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2DD4BF" />
            <stop offset="1" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="lr-side" x1="14" y1="24" x2="24" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F766E" />
            <stop offset="1" stopColor="#115E59" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#061817" stroke="#2DD4BF" strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Isometric cube */}
        <path d="M24 11L36 18L24 25L12 18L24 11Z" fill="url(#lr-top)" />
        <path d="M12 18L24 25V37L12 30V18Z" fill="url(#lr-side)" />
        <path d="M36 18L24 25V37L36 30V18Z" fill="#134E4A" />
        {/* Logistics loop track */}
        <circle cx="24" cy="24" r="2" fill="#CCFBF1" />
      </svg>
    );
  }

  // Djobba.works - Collaborative infinity gear talent link
  if (normalized.includes('djobba')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="dj-grad" x1="10" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F43F5E" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#1C0D11" stroke="#F43F5E" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="18" cy="24" r="7" stroke="url(#dj-grad)" strokeWidth="3" />
        <circle cx="30" cy="24" r="7" stroke="url(#dj-grad)" strokeWidth="3" />
        <circle cx="18" cy="24" r="2.5" fill="#FFE4E6" />
        <circle cx="30" cy="24" r="2.5" fill="#FFE4E6" />
        <path d="M18 17L30 31" stroke="#FFF1F2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Trusting Work - Verification biometric security shield
  if (normalized.includes('trusting')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="tw-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0C1322" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" />
        <path
          d="M24 10L36 15V24C36 31.5 24 38 24 38C24 38 12 31.5 12 24V15L24 10Z"
          fill="url(#tw-grad)"
          stroke="#93C5FD"
          strokeWidth="1.5"
        />
        <path d="M19 24L23 28L29 20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Woningvry - Modern architectural roofline & master key
  if (normalized.includes('woningvry')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="wv-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#065F46" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#071914" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Sleek roofline */}
        <path d="M12 25L24 13L36 25" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 22V35H31V22" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" fill="url(#wv-grad)" fillOpacity="0.4" />
        {/* Keyhole / doorway */}
        <rect x="22" y="27" width="4" height="8" rx="2" fill="#D1FAE5" />
      </svg>
    );
  }

  // Xabi World - Meridian global sphere with orbital ring
  if (normalized.includes('xabi')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="xw-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#312E81" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0E1026" stroke="#6366F1" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="24" cy="24" r="12" stroke="#818CF8" strokeWidth="1.75" fill="url(#xw-grad)" />
        <ellipse cx="24" cy="24" rx="12" ry="5" stroke="#C7D2FE" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="24" y1="12" x2="24" y2="36" stroke="#C7D2FE" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Fallback generic business crest
  return (
    <div className={cn('flex items-center justify-center rounded-xl bg-muted border border-border/60', className)}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

/**
 * Single Company Card / Pill with Logo, Name & Tag
 */
export function CompanyLogoBadge({
  company,
  onClick,
  active = false,
  compact = false,
}: {
  company: EcosystemCompanyData;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border transition-all duration-300 select-none cursor-pointer',
        compact
          ? 'px-3.5 py-2.5 bg-background/60 hover:bg-muted/60 backdrop-blur-md'
          : 'p-4 bg-card/60 hover:bg-card/90 backdrop-blur-xl',
        active
          ? cn(company.borderColor, 'bg-muted/80 shadow-lg scale-[1.02]')
          : 'border-border/60 hover:border-foreground/20 hover:scale-[1.01]'
      )}
    >
      <CompanyLogoSvg id={company.id} className={compact ? 'h-7 w-7' : 'h-10 w-10'} />

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {company.shortName}
          </span>
          {company.id === 'crmos' && (
            <span className="rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-bold px-1.5 py-0.2 border border-blue-500/20">
              CORE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono text-[10px] text-primary/80">{company.tag}</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="truncate">{company.industry}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Continuous Infinite Marquee of Company Logos
 */
export function EcosystemLogosMarquee({
  onSelectCompany,
}: {
  onSelectCompany?: (comp: EcosystemCompanyData) => void;
}) {
  // Duplicate for seamless infinite loop
  const duplicated = [...ECOSYSTEM_COMPANIES, ...ECOSYSTEM_COMPANIES];

  return (
    <div className="w-full overflow-hidden py-4 relative group">
      {/* Edge gradient mask for Apple smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-4 animate-marquee-smooth hover:[animation-play-state:paused] w-max">
        {duplicated.map((comp, idx) => (
          <div
            key={`${comp.id}-${idx}`}
            onClick={() => onSelectCompany?.(comp)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/50 bg-background/70 hover:bg-muted/80 backdrop-blur-md cursor-pointer hover:border-primary/40 transition-all hover:scale-[1.04] shadow-sm shrink-0"
          >
            <CompanyLogoSvg id={comp.id} className="h-7 w-7" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs text-foreground tracking-tight whitespace-nowrap">
                {comp.shortName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{comp.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Ecosystem Showcase Section for Landing Page
 */
export function EcosystemShowcaseSection() {
  const [selectedCompany, setSelectedCompany] = useState<EcosystemCompanyData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Alle');

  const categories = ['Alle', 'Holding & AI', 'Sales & Community', 'Fintech & Growth', 'HR & Werving', 'Vastgoed & Logistiek'];

  const filtered = activeCategory === 'Alle'
    ? ECOSYSTEM_COMPANIES
    : ECOSYSTEM_COMPANIES.filter((c) => c.category === activeCategory);

  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-muted/10 py-20 sm:py-28">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Het CRMos Ecosysteem</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Verbonden met 13 Toonaangevende{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Bedrijven &amp; Partners
            </span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Van high-ticket verkoopclubs en kapitaalallocatie tot relocatie en recruitment. Alle organisaties
            werken in CRMos samen via unieke bedrijfstags, realtime synchronisatie en de centrale CRMos API.
          </p>
        </div>

        {/* Category Pills Filter */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200',
                activeCategory === cat
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 13 Companies Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((company) => (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className="group p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CompanyLogoSvg id={company.id} className="h-10 w-10 shadow-sm" />
                  <span className={cn('text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border', company.bgLight, company.textColor, company.borderColor)}>
                    {company.tag}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{company.name}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{company.industry}</p>
                </div>

                <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-2">
                  {company.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate font-mono">{company.domain}</span>
                <span className="text-primary font-medium flex items-center gap-1 group-hover:underline">
                  Details inzien
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for detailed company view */}
        {selectedCompany && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedCompany(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl border border-border/70 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="absolute top-5 right-5 h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <CompanyLogoSvg id={selectedCompany.id} className="h-14 w-14 shadow-md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{selectedCompany.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded-full border', selectedCompany.bgLight, selectedCompany.textColor, selectedCompany.borderColor)}>
                      {selectedCompany.tag}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{selectedCompany.industry}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Over deze organisatie</span>
                  <p className="text-sm text-foreground/90 leading-relaxed">{selectedCompany.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-border/50 bg-background/50">
                    <span className="text-muted-foreground block text-[11px]">Domein</span>
                    <span className="font-semibold text-foreground font-mono">{selectedCompany.domain}</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/50 bg-background/50">
                    <span className="text-muted-foreground block text-[11px]">Ecosysteem Rol</span>
                    <span className="font-semibold text-foreground">{selectedCompany.category}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Actief in CRMos &amp; VVC API Netwerk</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Medewerkers met de tag <span className="font-mono font-bold text-foreground">{selectedCompany.tag}</span> kunnen
                    direct worden gevonden in het CRM, uitgenodigd om teams te versterken en deals sluiten binnen het netwerk.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-end gap-3">
                <a
                  href={selectedCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/60 hover:bg-muted text-xs font-medium text-foreground transition-all"
                >
                  <span>Website openen</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
