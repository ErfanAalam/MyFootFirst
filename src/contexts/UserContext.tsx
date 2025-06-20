import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';


interface UserData {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  gender: string;
  insoleAnswers?: Record<string, any>;
  country?: string;
  phone?: string;
  dob?: string;
  maxStepReached?: number;
}

interface UserContextType {
  user: FirebaseAuthTypes.User | null;
  userData: UserData | null;
  loading: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  saveInsoleAnswers: (answers: Record<string, any>) => Promise<void>;
  updateUserStep: (step: number, isDirectCartAccess?: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = getAuth().onAuthStateChanged(async (authUser: FirebaseAuthTypes.User | null) => {
      setUser(authUser);

      if (authUser) {
        await fetchUserData(authUser.uid);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists) {
        const data = userDoc.data() || {};
        setUserData({
          id: userId,
          firstName: data.firstName || '',
          surname: data.surname || '',
          email: data.email || '',
          gender: data.gender || '',
          insoleAnswers: data.insoleAnswers || {},
          country: data.country || '',
          phone: data.phone || '',
          dob: data.dob || '',
          maxStepReached: data.maxStepReached || 0,
          ...data,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) {
      return;
    }

    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, data);

      // Update local state
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const saveInsoleAnswers = async (answers: Record<string, any>): Promise<void> => {
    if (!user) {
      return;
    }

    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);

      // Update only the insole answers in Firestore
      await updateDoc(userDocRef, {
        insoleAnswers: answers,
      });

      // Update local state
      setUserData(prev =>
        prev ? { ...prev, insoleAnswers: answers } : null
      );
    } catch (error) {
      console.error('Error saving insole answers:', error);
      throw error;
    }
  };

  const updateUserStep = async (step: number, isDirectCartAccess: boolean = false) => {
    if (!user || !userData) return;

    try {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);

      // If it's direct cart access (not through insole flow), don't update step
      if (isDirectCartAccess) return;

      // Get current max step
      const userDoc = await getDoc(userDocRef);
      const currentMaxStep = userDoc.data()?.maxStepReached || 0;

      // Only update if new step is higher than current max step
      if (step > currentMaxStep) {
        await updateDoc(userDocRef, {
          maxStepReached: step,
        });

        // Update local state
        setUserData(prev => prev ? { ...prev, maxStepReached: step } : null);
      }
    } catch (error) {
      console.error('Error updating user step:', error);
    }
  };

  const value = {
    user,
    userData,
    loading,
    updateUserData,
    saveInsoleAnswers,
    hasProfile,
    setHasProfile,
    updateUserStep,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
