const GLOBAL_SCOPE = '__COMPANY_SCOPE_ALL__';

let overrideCompanyId = null;
const listeners = new Set();

export const setCompanyScopeOverride = (companyId) => {
  if (companyId === overrideCompanyId) {
    return;
  }
  overrideCompanyId = companyId ?? null;
  listeners.forEach((listener) => {
    try {
      listener(overrideCompanyId);
    } catch (error) {
      console.error('companyScope listener error', error);
    }
  });
};

export const getCompanyScopeOverride = () => overrideCompanyId;

export const isGlobalCompanyScope = () => overrideCompanyId === GLOBAL_SCOPE;

export const subscribeCompanyScope = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const COMPANY_SCOPE_GLOBAL = GLOBAL_SCOPE;
