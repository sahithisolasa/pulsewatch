import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase.ts';
import { AppUser, Watchlist, UserStockCheckpoint } from '../types.ts';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  watchlists: Watchlist[];
  activeWatchlistId: string;
  checkpoints: Record<string, UserStockCheckpoint>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  setActiveWatchlistId: (id: string) => void;
  createWatchlist: (name: string) => Promise<string>;
  renameWatchlist: (id: string, newName: string) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  addStockToWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  removeStockFromWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  updateCheckpoints: (newCheckpoints: Record<string, { price: number; volume?: number; score?: number; classification?: string }>) => Promise<void>;
  resetCheckpointsToPast: (awayMinutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_STOCKS = ['INFY', 'TATAMOTORS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'TCS', 'ITC', 'SBIN'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('default');
  const [checkpoints, setCheckpoints] = useState<Record<string, UserStockCheckpoint>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
        });
        await loadUserData(fbUser.uid);
      } else {
        setUser(null);
        setWatchlists([]);
        setCheckpoints({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      // 1. Fetch user watchlists
      let userWatchlists: Watchlist[] = [];
      try {
        const q = query(collection(db, 'watchlists'), where('userId', '==', uid));
        const snap = await getDocs(q);
        userWatchlists = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Watchlist));
      } catch (err) {
        console.warn('Watchlist fetch notice:', err);
      }

      if (userWatchlists.length === 0) {
        // Initialize default watchlist "My Watchlist"
        const defaultWl: Watchlist = {
          id: `wl-${uid}-default`,
          name: 'My Watchlist',
          userId: uid,
          isDefault: true,
          stocks: [...DEFAULT_STOCKS],
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'watchlists', defaultWl.id), defaultWl);
        } catch (err) {
          console.warn('Default watchlist save fallback:', err);
        }
        userWatchlists = [defaultWl];
      }

      setWatchlists(userWatchlists);
      setActiveWatchlistId(userWatchlists[0].id);

      // 2. Fetch user checkpoints
      try {
        const cpQ = query(collection(db, 'userCheckpoints'), where('userId', '==', uid));
        const cpSnap = await getDocs(cpQ);
        const loadedCheckpoints: Record<string, UserStockCheckpoint> = {};
        cpSnap.docs.forEach((d) => {
          const cp = d.data() as UserStockCheckpoint;
          loadedCheckpoints[cp.stockId] = cp;
        });

        // If no checkpoints yet, seed initial baseline from 5h 24m ago
        if (Object.keys(loadedCheckpoints).length === 0) {
          const fiveHoursAgo = new Date(Date.now() - 324 * 60 * 1000).toISOString();
          const seededPrices: Record<string, number> = {
            INFY: 1590.20,
            TATAMOTORS: 1000.50,
            RELIANCE: 2890.00,
            HDFCBANK: 1615.00,
            ICICIBANK: 1195.00,
            TCS: 3912.00,
            ITC: 446.20,
            SBIN: 812.50,
          };

          for (const sym of DEFAULT_STOCKS) {
            const cpData: UserStockCheckpoint = {
              userId: uid,
              stockId: sym,
              lastCheckedAt: fiveHoursAgo,
              lastSeenPrice: seededPrices[sym] || 1000,
              lastSeenVolume: 5000000,
              lastSeenAttentionScore: 20,
              lastSeenClassification: 'Normal',
            };
            loadedCheckpoints[sym] = cpData;
            try {
              await setDoc(doc(db, 'userCheckpoints', `cp-${uid}-${sym}`), cpData);
            } catch (ignore) {}
          }
        }

        setCheckpoints(loadedCheckpoints);
      } catch (cpErr) {
        console.warn('Checkpoints fetch notice:', cpErr);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && res.user) {
      await updateProfile(res.user, { displayName: name });
    }
    // Save to users collection
    try {
      await setDoc(doc(db, 'users', res.user.uid), {
        id: res.user.uid,
        email: res.user.email,
        displayName: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('User profile creation notice:', err);
    }
  };

  const loginDemo = async () => {
    // 1-Click Demo account login
    const demoEmail = 'demo.analyst@pulsewatch.io';
    const demoPass = 'PulseWatch2026!';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch (err: any) {
      // If user doesn't exist, create it
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await signup(demoEmail, demoPass, 'Demo Market Analyst');
        } catch (signUpErr) {
          // If signup fails because already exists, retry login
          await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        }
      } else {
        throw err;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const createWatchlist = async (name: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in');
    const newId = `wl-${user.uid}-${Date.now()}`;
    const newWl: Watchlist = {
      id: newId,
      name,
      userId: user.uid,
      isDefault: false,
      stocks: ['INFY', 'RELIANCE', 'TCS'],
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'watchlists', newId), newWl);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'watchlists');
    }

    setWatchlists((prev) => [...prev, newWl]);
    setActiveWatchlistId(newId);
    return newId;
  };

  const renameWatchlist = async (id: string, newName: string) => {
    if (!user) return;
    const target = watchlists.find((w) => w.id === id);
    if (!target) return;

    const updated = { ...target, name: newName };
    try {
      await setDoc(doc(db, 'watchlists', id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `watchlists/${id}`);
    }

    setWatchlists((prev) => prev.map((w) => (w.id === id ? updated : w)));
  };

  const deleteWatchlist = async (id: string) => {
    if (!user) return;
    if (watchlists.length <= 1) {
      throw new Error('You must keep at least one watchlist.');
    }

    try {
      await deleteDoc(doc(db, 'watchlists', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `watchlists/${id}`);
    }

    const remaining = watchlists.filter((w) => w.id !== id);
    setWatchlists(remaining);
    if (activeWatchlistId === id) {
      setActiveWatchlistId(remaining[0].id);
    }
  };

  const addStockToWatchlist = async (watchlistId: string, symbol: string) => {
    if (!user) return;
    const upper = symbol.toUpperCase().trim();
    const wl = watchlists.find((w) => w.id === watchlistId);
    if (!wl) return;

    if (wl.stocks.includes(upper)) {
      throw new Error(`${upper} is already in this watchlist.`);
    }

    const updatedStocks = [...wl.stocks, upper];
    const updated = { ...wl, stocks: updatedStocks };

    try {
      await setDoc(doc(db, 'watchlists', watchlistId), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `watchlists/${watchlistId}`);
    }

    setWatchlists((prev) => prev.map((w) => (w.id === watchlistId ? updated : w)));
  };

  const removeStockFromWatchlist = async (watchlistId: string, symbol: string) => {
    if (!user) return;
    const upper = symbol.toUpperCase().trim();
    const wl = watchlists.find((w) => w.id === watchlistId);
    if (!wl) return;

    const updatedStocks = wl.stocks.filter((s) => s !== upper);
    const updated = { ...wl, stocks: updatedStocks };

    try {
      await setDoc(doc(db, 'watchlists', watchlistId), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `watchlists/${watchlistId}`);
    }

    setWatchlists((prev) => prev.map((w) => (w.id === watchlistId ? updated : w)));
  };

  const updateCheckpoints = async (
    newCheckpoints: Record<string, { price: number; volume?: number; score?: number; classification?: string }>
  ) => {
    if (!user) return;
    const nowISO = new Date().toISOString();
    const updatedMap: Record<string, UserStockCheckpoint> = { ...checkpoints };

    for (const [sym, data] of Object.entries(newCheckpoints)) {
      const cp: UserStockCheckpoint = {
        userId: user.uid,
        stockId: sym,
        lastCheckedAt: nowISO,
        lastSeenPrice: data.price,
        lastSeenVolume: data.volume || 5000000,
        lastSeenAttentionScore: data.score,
        lastSeenClassification: data.classification,
      };

      updatedMap[sym] = cp;
      try {
        await setDoc(doc(db, 'userCheckpoints', `cp-${user.uid}-${sym}`), cp);
      } catch (err) {
        console.warn('Checkpoint update local fallback:', err);
      }
    }

    setCheckpoints(updatedMap);
  };

  const resetCheckpointsToPast = async (awayMinutes: number) => {
    if (!user) return;
    const pastTimeISO = new Date(Date.now() - awayMinutes * 60 * 1000).toISOString();
    const seededPrices: Record<string, number> = {
      INFY: 1590.20,
      TATAMOTORS: 1000.50,
      RELIANCE: 2890.00,
      HDFCBANK: 1615.00,
      ICICIBANK: 1195.00,
      TCS: 3912.00,
      ITC: 446.20,
      SBIN: 812.50,
    };

    const updatedMap: Record<string, UserStockCheckpoint> = {};
    for (const [sym, price] of Object.entries(seededPrices)) {
      const cp: UserStockCheckpoint = {
        userId: user.uid,
        stockId: sym,
        lastCheckedAt: pastTimeISO,
        lastSeenPrice: price,
        lastSeenVolume: 4000000,
        lastSeenAttentionScore: 20,
        lastSeenClassification: 'Normal',
      };
      updatedMap[sym] = cp;
      try {
        await setDoc(doc(db, 'userCheckpoints', `cp-${user.uid}-${sym}`), cp);
      } catch (err) {}
    }
    setCheckpoints(updatedMap);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        watchlists,
        activeWatchlistId,
        checkpoints,
        login,
        signup,
        loginDemo,
        logout,
        setActiveWatchlistId,
        createWatchlist,
        renameWatchlist,
        deleteWatchlist,
        addStockToWatchlist,
        removeStockFromWatchlist,
        updateCheckpoints,
        resetCheckpointsToPast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
