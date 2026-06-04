import { create } from 'zustand'

interface SessionState {
    user: { id: string; username: string; role: string } | null
    sessionToken: string | null
    companyName: string | null
    activeYear: { id: string, name: string, start_date: string, end_date: string } | null
    setUser: (user: SessionState['user'], token: string) => void
    setCompany: (name: string, year: SessionState['activeYear']) => void
    logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
    user: null,
    sessionToken: null,
    companyName: null,
    activeYear: null,
    setUser: (user, sessionToken) => set({ user, sessionToken }),
    setCompany: (companyName, activeYear) => set({ companyName, activeYear }),
    logout: () => set({ user: null, sessionToken: null, companyName: null, activeYear: null })
}))
