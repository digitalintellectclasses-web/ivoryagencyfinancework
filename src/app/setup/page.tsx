'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SetupPage() {
  const [ppPassword, setPpPassword] = useState('');
  const [priyPassword, setPriyPassword] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppPassword || !priyPassword) return;
    setLoading(true);
    setStatus('');

    try {
      // 1. Create PPSOLAR (Admin)
      setStatus('Creating PPSOLAR admin account...');
      const ppCred = await createUserWithEmailAndPassword(auth, 'ppsolar@ivory.agency', ppPassword);
      await setDoc(doc(db, 'users', ppCred.user.uid), {
        username: 'PPSOLAR',
        displayName: 'PP Solar Admin',
        role: 'admin',
        email: 'ppsolar@ivory.agency',
        createdAt: serverTimestamp(),
      });

      // 2. Create PRIYANKA (Employee)
      setStatus('Creating PRIYANKA employee account...');
      const priyaCred = await createUserWithEmailAndPassword(auth, 'priyanka@ivory.agency', priyPassword);
      await setDoc(doc(db, 'users', priyaCred.user.uid), {
        username: 'PRIYANKA',
        displayName: 'Priyanka',
        role: 'employee',
        email: 'priyanka@ivory.agency',
        createdAt: serverTimestamp(),
      });

      setStatus('✅ Both accounts created successfully!');
      setDone(true);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">One-Time Setup</h1>
          <p className="text-zinc-400 text-sm mt-1">Creates PPSOLAR (admin) and PRIYANKA (employee) accounts in Firebase. Run this once only.</p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{status}</div>
            <div className="text-zinc-400 text-sm space-y-1">
              <p>✅ <strong className="text-white">PPSOLAR</strong> — email: ppsolar@ivory.agency</p>
              <p>✅ <strong className="text-white">PRIYANKA</strong> — email: priyanka@ivory.agency</p>
              <p className="mt-3 text-zinc-500">You can now <a href="/" className="text-purple-400 underline">go to the login page</a>.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">PPSOLAR Password (Admin)</label>
              <input
                required
                type="password"
                value={ppPassword}
                onChange={e => setPpPassword(e.target.value)}
                placeholder="Set a strong password"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">PRIYANKA Password (Employee)</label>
              <input
                required
                type="password"
                value={priyPassword}
                onChange={e => setPriyPassword(e.target.value)}
                placeholder="Set a strong password"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {status && (
              <div className={`text-sm px-4 py-2.5 rounded-xl border ${status.startsWith('❌') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold transition-all text-sm"
            >
              {loading ? 'Creating accounts...' : 'Create Accounts'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
