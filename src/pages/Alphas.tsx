import React from 'react';

export const Alphas: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Alphas</h1>
      <div className="bg-alphabag-darkgray p-6 rounded-xl border border-alphabag-border">
        <p className="text-alphabag-muted mb-4">Beta Stream Active. Neural link syncing...</p>
        <div className="flex flex-col space-y-6">
          <div className="border border-alphabag-border p-4 rounded-lg bg-black/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-alphabag-yellow/20"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-white/5 rounded"></div>
          </div>
          <div className="border border-alphabag-border p-4 rounded-lg bg-black/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-alphabag-yellow/20"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
