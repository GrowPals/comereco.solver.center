
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { clearSessionCache, clearLocalAuthStorage } from '@/lib/supabaseHelpers';
import PageLoader from '@/components/PageLoader';
import logger from '@/utils/logger';

const AuthContext = createContext();

export const SupabaseAuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIX: Consulta separada para evitar embed ambiguo company:companies(*) que causa errores 500
  // Según REFERENCIA_TECNICA_BD_SUPABASE.md, debemos evitar embeds ambiguos y usar consultas separadas
  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      logger.debug('fetchUserProfile: No authUser provided');
      setUser(null);
      return null;
    }

    logger.debug('fetchUserProfile: Starting for user:', {
      id: authUser.id,
      email: authUser.email
    });

    try {
      // Primero obtener el perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id, full_name, avatar_url, role_v2, phone, updated_at')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        logger.error('Error fetching user profile:', profileError);
        logger.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });

        // CRÍTICO: NO hacer signOut automáticamente
        // Esto permite que el usuario vea el error y podamos diagnosticar
        // await supabase.auth.signOut(); // COMENTADO

        // Setear user con datos mínimos para permitir diagnóstico
        const userWithError = {
          ...authUser,
          hasProfile: false,
          profileError: profileError.message
        };
        logger.warn('Setting user without profile:', userWithError);
        setUser(userWithError);
        return null;
      }

      logger.debug('Profile fetched successfully:', profile);

      // Luego obtener la empresa por separado para evitar el embed ambiguo
      let company = null;
      if (profile.company_id) {
        logger.debug('Fetching company:', profile.company_id);
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, bind_location_id, bind_price_list_id')
          .eq('id', profile.company_id)
          .single();

        if (companyError) {
          logger.warn('Error fetching company:', companyError);
        }

        if (!companyError && companyData) {
          company = companyData;
          logger.debug('Company fetched:', company.name);
        }
      } else {
        logger.warn('Profile has no company_id');
      }

      const userWithCompany = { ...authUser, ...profile, company, hasProfile: true };
      logger.debug('Complete user object:', {
        id: userWithCompany.id,
        email: userWithCompany.email,
        role_v2: userWithCompany.role_v2,
        company: userWithCompany.company?.name || 'No company'
      });
      setUser(userWithCompany);
      return userWithCompany;
    } catch (e) {
      logger.error('Unexpected error in fetchUserProfile:', e);

      // Setear user con datos mínimos para diagnóstico
      const userWithError = {
        ...authUser,
        hasProfile: false,
        profileError: e.message
      };
      setUser(userWithError);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logger.error('Error getting session:', error);
      }
      setSession(session);
      // FIX: Llamar a fetchUserProfile al inicializar
      await fetchUserProfile(session?.user);
      setLoading(false);
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      setSession(session);
      // FIX: Llamar a fetchUserProfile en cada cambio de estado de auth
      await fetchUserProfile(session?.user);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error };
      }

      // CORREGIDO: Actualizar sesión y cargar perfil inmediatamente después del login
      if (data.session) {
        setSession(data.session);
        setLoading(false); // Asegurar que loading sea false después del login
        // Cargar el perfil del usuario inmediatamente después del login
        // Si falla, no bloqueamos el login pero logueamos el error
        try {
          await fetchUserProfile(data.session.user);
        } catch (profileError) {
          logger.error('Error loading user profile after login:', profileError);
          // No bloqueamos el login aunque falle el perfil
          // El usuario podrá intentar recargar su perfil más tarde
        }
      }

      return { error: null };
    } catch (err) {
      logger.error('Unexpected error during sign in:', err);
      setLoading(false); // Asegurar que loading sea false incluso en caso de error
      return { error: err };
    }
  }, [fetchUserProfile]);
  
  const signOut = useCallback(async () => {
    const handleLocalSignOut = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        logger.warn('Local sign out failed (continuing):', localError);
      }
    };

    try {
      await handleLocalSignOut();
      clearLocalAuthStorage();
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error && !error.message?.toLowerCase().includes('session not found')) {
        logger.error('Error signing out:', error);
        return { error };
      }

      clearSessionCache();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (err) {
      logger.error('Unexpected error during sign out:', err);
      await handleLocalSignOut();
      clearLocalAuthStorage();
      clearSessionCache();
      setUser(null);
      setSession(null);
      return { error: err };
    }
  }, []);


  const refreshUserProfile = useCallback(async () => {
    const authUser = session?.user || user;
    if (!authUser) {
      return null;
    }
    return fetchUserProfile(authUser);
  }, [fetchUserProfile, session?.user, user]);

  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signOut,
    refreshUserProfile,
  }), [session, user, loading, signIn, signOut, refreshUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? <PageLoader /> : children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
