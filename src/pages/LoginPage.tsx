import React, { useState } from 'react';
import { AlertCircle, Lock, LogIn, ShieldAlert, User, Warehouse } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin_utama');
  const [password, setPassword] = useState('PasswordAdmin123!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-4">
          <Warehouse className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          SISTEM KAWASAN PERGUDANGAN
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Platform Kendali Operasional Gate, Loading Dock, & Persuratan Resmi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          {errorMsg && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 mr-2.5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username Pengguna
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-brand-600" />
              Pilih Cepat Akun Demo (RBAC Role Testing):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin_utama', 'PasswordAdmin123!')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-md border border-slate-200 transition-colors text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('petugas_pos1', 'PasswordPetugas123!')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-md border border-slate-200 transition-colors text-center"
              >
                Petugas Gate
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin_gudang1', 'PasswordGudang123!')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-md border border-slate-200 transition-colors text-center"
              >
                Admin Gudang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
