import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { getAllCompanies } from '@/services/companyService';
import { setCompanyScopeOverride, COMPANY_SCOPE_GLOBAL } from '@/lib/companyScopeStore';

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

  const { data: companies = [], isLoading } = useQuery({
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

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isGlobalView, setIsGlobalView] = useState(isDev);

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
