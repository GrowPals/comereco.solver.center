
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
      setUser(null);
      return null;
    }
    try {
      // Primero obtener el perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id, full_name, avatar_url, role_v2, updated_at')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        logger.error('Error fetching user profile:', profileError);
        await supabase.auth.signOut();
        setUser(null);
        return null;
      }

      // Luego obtener la empresa por separado para evitar el embed ambiguo
      let company = null;
      if (profile.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, bind_location_id, bind_price_list_id')
          .eq('id', profile.company_id)
          .single();
        
        if (!companyError && companyData) {
          company = companyData;
        }
      }

      const userWithCompany = { ...authUser, ...profile, company };
      setUser(userWithCompany);
      return userWithCompany;
    } catch (e) {
      logger.error('Unexpected error fetching profile:', e);
      setUser(null);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);
  
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
