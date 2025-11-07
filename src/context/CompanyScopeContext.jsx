import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { getAllCompanies } from '@/services/companyService';
import { setCompanyScopeOverride, COMPANY_SCOPE_GLOBAL } from '@/lib/companyScopeStore';
import { invalidateAccessContext } from '@/lib/accessControl';

const GLOBAL_SCOPE_STORAGE_KEY = 'companyScope:isGlobal';

const readStoredGlobalPreference = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(GLOBAL_SCOPE_STORAGE_KEY) === 'true';
};

const persistGlobalPreference = (isGlobal) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(GLOBAL_SCOPE_STORAGE_KEY, isGlobal ? 'true' : 'false');
};

const CompanyScopeContext = createContext({
  companies: [],
  activeCompanyId: null,
  isGlobalView: false,
  canViewAllCompanies: false,
  setActiveCompanyId: () => {},
  toggleGlobalView: () => {},
  isLoading: true,
});

export const CompanyScopeProvider = ({ children }) => {
  const { user } = useSupabaseAuth();
  const isDev = user?.role_v2 === 'dev';
  const userCompany = user?.company;
  const queryClient = useQueryClient();

  const { data: rawCompanies = [], isLoading } = useQuery({
    queryKey: ['company-scope', isDev ? 'all' : userCompany?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isDev) {
        return await getAllCompanies();
      }
      return userCompany ? [userCompany] : [];
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });
  const companies = useMemo(() => {
    if (!rawCompanies.length) return [];

    const toKey = (company) => {
      const location = company?.bind_location_id?.trim().toLowerCase();
      if (location) return `bind:${location}`;
      const priceList = company?.bind_price_list_id?.trim().toLowerCase();
      if (priceList) return `price:${priceList}`;
      const normalizedName = company?.name?.trim().toLowerCase();
      if (normalizedName) return `name:${normalizedName}`;
      return `id:${company?.id ?? Math.random().toString(36).slice(2)}`;
    };

    const preferCandidate = (current, next) => {
      const currentName = current?.name?.trim() ?? '';
      const nextName = next?.name?.trim() ?? '';

      // Prefer the shortest readable name (avoids "ComerECO - X" duplicating "X")
      if (currentName.length !== nextName.length) {
        return nextName.length < currentName.length;
      }

      const currentHasPrefix = currentName.includes(' - ');
      const nextHasPrefix = nextName.includes(' - ');
      if (currentHasPrefix !== nextHasPrefix) {
        return !nextHasPrefix;
      }

      // Default to keeping the first one
      return false;
    };

    const bestByKey = new Map();

    rawCompanies.forEach((company, index) => {
      if (!company) return;
      const key = toKey(company);
      const snapshot = bestByKey.get(key);

      if (!snapshot) {
        bestByKey.set(key, { company, index });
        return;
      }

      if (preferCandidate(snapshot.company, company)) {
        bestByKey.set(key, { company, index: snapshot.index });
      }
    });

    return Array.from(bestByKey.values())
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.company);
  }, [rawCompanies]);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isGlobalView, setIsGlobalViewRaw] = useState(() => (isDev ? readStoredGlobalPreference() : false));

  useEffect(() => {
    if (!isDev) {
      setIsGlobalViewRaw(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(GLOBAL_SCOPE_STORAGE_KEY);
      }
      return;
    }

    setIsGlobalViewRaw(readStoredGlobalPreference());
  }, [isDev]);

  const setIsGlobalView = (nextValue) => {
    setIsGlobalViewRaw(nextValue);
    if (isDev) {
      persistGlobalPreference(nextValue);
    }
  };

  // Inicializa selección cuando cambian las empresas disponibles o el rol
  useEffect(() => {
    if (!user) {
      setSelectedCompanyId(null);
      setIsGlobalView(false);
      return;
    }

    if (isDev) {
      if (!companies.length) return;
      setSelectedCompanyId((prev) => prev ?? companies[0]?.id ?? null);
    } else if (userCompany?.id) {
      setSelectedCompanyId(userCompany.id);
      setIsGlobalView(false);
    }
  }, [user, isDev, companies, userCompany?.id]);

  // Propaga la selección al store global
  useEffect(() => {
    if (!user) {
      setCompanyScopeOverride(null);
      return;
    }

    if (isDev) {
      if (isGlobalView) {
        setCompanyScopeOverride(COMPANY_SCOPE_GLOBAL);
      } else if (selectedCompanyId) {
        setCompanyScopeOverride(selectedCompanyId);
      }
      return;
    }

    if (selectedCompanyId) {
      setCompanyScopeOverride(selectedCompanyId);
    }
  }, [user, isDev, isGlobalView, selectedCompanyId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    invalidateAccessContext();
    queryClient.invalidateQueries({ predicate: () => true });
  }, [user?.id, isDev, isGlobalView, selectedCompanyId, queryClient]);

  const handleSetCompany = (companyId) => {
    setSelectedCompanyId(companyId || null);
    if (isDev) {
      setIsGlobalView(!companyId);
    }
  };

  const toggleGlobalView = (nextGlobal) => {
    if (!isDev) return;
    setIsGlobalView(nextGlobal);
  };

  const value = useMemo(() => {
    const activeCompany = companies.find((c) => c.id === selectedCompanyId) || null;
    return {
      companies,
      activeCompanyId: isGlobalView ? null : selectedCompanyId,
      activeCompany,
      isGlobalView: Boolean(isDev && isGlobalView),
      canViewAllCompanies: Boolean(isDev),
      setActiveCompanyId: handleSetCompany,
      toggleGlobalView,
      isLoading,
    };
  }, [companies, selectedCompanyId, isGlobalView, isDev, isLoading]);

  return (
    <CompanyScopeContext.Provider value={value}>
      {children}
    </CompanyScopeContext.Provider>
  );
};

export const useCompanyScope = () => useContext(CompanyScopeContext);
