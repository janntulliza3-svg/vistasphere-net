import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdminRole = async (activeUser: User | null) => {
      if (!activeUser) {
        if (mounted) setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", activeUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (mounted) setIsAdmin(!!data);
    };

    const syncSession = async (sess: Session | null) => {
      if (!mounted) return;
      setLoading(true);
      setSession(sess);
      setUser(sess?.user ?? null);
      await checkAdminRole(sess?.user ?? null);
      if (mounted) setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      void syncSession(sess);
    });

    supabase.auth.getSession().then(({ data }) => void syncSession(data.session));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, session, isAdmin, loading };
}