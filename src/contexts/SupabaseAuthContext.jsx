
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
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
      console.log('🔍 fetchUserProfile: No authUser provided');
      setUser(null);
      return null;
    }

    console.log('🔍 fetchUserProfile: Starting for user:', {
      id: authUser.id,
      email: authUser.email
    });

    try {
      // Primero obtener el perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        console.error('❌ Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        logger.error('Error fetching user profile:', profileError);

        // CRÍTICO: NO hacer signOut automáticamente
        // Esto permite que el usuario vea el error y podamos diagnosticar
        // await supabase.auth.signOut(); // COMENTADO

        // Setear user con datos mínimos para permitir diagnóstico
        const userWithError = {
          ...authUser,
          hasProfile: false,
          profileError: profileError.message
        };
        console.log('⚠️ Setting user without profile:', userWithError);
        setUser(userWithError);
        return null;
      }

      console.log('✅ Profile fetched successfully:', profile);

      // Luego obtener la empresa por separado para evitar el embed ambiguo
      let company = null;
      if (profile.company_id) {
        console.log('🔍 Fetching company:', profile.company_id);
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, bind_location_id, bind_price_list_id')
          .eq('id', profile.company_id)
          .single();

        if (companyError) {
          console.error('⚠️ Error fetching company:', companyError);
          logger.error('Error fetching company:', companyError);
        }

        if (!companyError && companyData) {
          company = companyData;
          console.log('✅ Company fetched:', company.name);
        }
      } else {
        console.warn('⚠️ Profile has no company_id');
      }

      const userWithCompany = { ...authUser, ...profile, company, hasProfile: true };
      console.log('✅ Complete user object:', {
        id: userWithCompany.id,
        email: userWithCompany.email,
        role_v2: userWithCompany.role_v2,
        company: userWithCompany.company?.name || 'No company'
      });
      setUser(userWithCompany);
      return userWithCompany;
    } catch (e) {
      console.error('💥 Unexpected error in fetchUserProfile:', e);
      logger.error('Unexpected error fetching profile:', e);

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
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  }, []);


  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signOut,
  }), [session, user, loading, signIn, signOut]);

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
