import { getCompanyScopeOverride, COMPANY_SCOPE_GLOBAL } from '@/lib/companyScopeStore';

export const scopeToCompany = (query, access, column = 'company_id', explicitCompanyId) => {
  if (!access || typeof query?.eq !== 'function') {
    return query;
  }

  const override = getCompanyScopeOverride();

  if (access.isDev) {
    if (explicitCompanyId) {
      return query.eq(column, explicitCompanyId);
    }
    if (override && override !== COMPANY_SCOPE_GLOBAL) {
      return query.eq(column, override);
    }
    return query;
  }

  const targetCompanyId = explicitCompanyId ?? access.companyId;
  if (!targetCompanyId) {
    throw new Error('No se pudo determinar la empresa actual.');
  }

  return query.eq(column, targetCompanyId);
};
