import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/auth'
import type { Profile } from '../types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  initialize: async () => {
    // Prevent multiple initializations
    if (!(useAuthStore.getState() as any)._initialized) {
      (useAuthStore.getState() as any)._initialized = true
    } else {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    let profile: Profile | null = null
    if (session?.user) {
      profile = await getProfile(session.user.id)
    }
    set({ session, profile, isLoading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      let profile: Profile | null = null
      if (session?.user) {
        profile = await getProfile(session.user.id)
      }
      set({ session, profile, isLoading: false })
    })
  },
}))
