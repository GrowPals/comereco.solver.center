
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast.js';
import logger from '@/utils/logger';

const AuthContext = createContext(undefined);

export const SupabaseAuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:company_id ( name, bind_location_id, bind_price_list_id )
        `)
        .eq('id', user.id)
        .single();
      
      if (error) throw error;

      // Fusionamos la información del perfil y de la compañía
      const userProfile = {
        ...data,
        company: data.company
      };
      
      setProfile(userProfile);
    } catch (error) {
      logger.error('Error fetching profile with company:', error.message);
      setProfile(null);
    }
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    await fetchProfile(session?.user);
    setLoading(false);
  }, [fetchProfile]);
  
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);
  
  const updateUser = useCallback(async (updateData) => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(prev => ({ ...prev, ...data }));
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }, [profile]);
  
  const authAction = useCallback(async (action, credentials) => {
    setLoading(true);
    const { error } = await action(credentials);
    if (error) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Something went wrong.",
      });
    }
    setLoading(false);
    return { error };
  }, [toast]);
  
  const signUp = (email, password, options) => authAction(supabase.auth.signUp, { email, password, options });
  const signIn = (email, password) => authAction(supabase.auth.signInWithPassword, { email, password });
  const signOut = () => authAction(supabase.auth.signOut);

  const value = useMemo(() => ({
    user: profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser
  }), [profile, session, loading, signUp, signIn, signOut, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
