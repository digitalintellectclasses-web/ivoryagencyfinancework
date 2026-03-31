'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  managedBy: 'Pratik' | 'Pranav';
  paymentMethod: 'cash' | 'online';
  createdAt?: any;
};

export type Client = {
  id: string;
  name: string;
  packageTier: number;
  activationDate: string;
  expiryDate: string;
  externalCosts: number;
  createdAt?: any;
};

export type PartnerEquity = {
  id: string;
  partnerId: 'Pratik' | 'Pranav';
  type: 'investment' | 'drawing';
  amount: number;
  date: string;
  createdAt?: any;
};

export type SalaryPayment = {
  id: string;
  employeeUserId: string;
  employeeName: string;
  amount: number;
  month: string;
  date: string;
  paidBy: 'Pratik' | 'Pranav';
  paymentMethod: 'cash' | 'online';
  note: string;
  createdAt?: any;
};

type FinanceContextType = {
  transactions: Transaction[];
  clients: Client[];
  equities: PartnerEquity[];
  salaryPayments: SalaryPayment[];
  isAdmin: boolean;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  addEquity: (equity: Omit<PartnerEquity, 'id'>) => Promise<void>;
  addSalaryPayment: (sp: Omit<SalaryPayment, 'id'>) => Promise<void>;
  deleteSalaryPayment: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  setIsAdmin: (val: boolean) => void;
  isLoaded: boolean;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [equities, setEquities] = useState<PartnerEquity[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setClients([]);
      setEquities([]);
      setSalaryPayments([]);
      setIsLoaded(true);
      return;
    }

    // Real-time listeners for Firestore collections
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)));
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
    });

    const unsubEquities = onSnapshot(collection(db, 'equities'), (snapshot) => {
      setEquities(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PartnerEquity)));
    });

    const unsubSalaries = onSnapshot(collection(db, 'salaries'), (snapshot) => {
      setSalaryPayments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SalaryPayment)));
    });

    setIsLoaded(true);

    return () => {
      unsubTx();
      unsubClients();
      unsubEquities();
      unsubSalaries();
    };
  }, [currentUser]);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      createdAt: serverTimestamp(),
    });
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: serverTimestamp(),
    });
  };

  const addEquity = async (equity: Omit<PartnerEquity, 'id'>) => {
    await addDoc(collection(db, 'equities'), {
      ...equity,
      createdAt: serverTimestamp(),
    });
  };

  const addSalaryPayment = async (sp: Omit<SalaryPayment, 'id'>) => {
    await addDoc(collection(db, 'salaries'), {
      ...sp,
      createdAt: serverTimestamp(),
    });
  };

  const deleteSalaryPayment = async (id: string) => {
    await deleteDoc(doc(db, 'salaries', id));
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, 'clients', id));
  };

  return (
    <FinanceContext.Provider value={{ 
      transactions, clients, equities, salaryPayments, isAdmin,
      addTransaction, addClient, addEquity, addSalaryPayment, deleteSalaryPayment,
      deleteTransaction, deleteClient, setIsAdmin, isLoaded 
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
