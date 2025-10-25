import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { SignOut, Trophy } from '@phosphor-icons/react';
import { DynamicDashboard } from '@/components/DynamicDashboard';
import { User, Athlete, Result } from '@/lib/types';

interface AthleteLayoutProps {
  currentUser: User;
  logout: () => void;
  currentAthlete: Athlete | null;
  results: Result[];
  coaches: User[];
}

const AthleteLayout: React.FC<AthleteLayoutProps> = ({
  currentUser,
  logout,
  currentAthlete,
  results,
  coaches,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="border-b bg-linear-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-linear-to-br from-accent/10 to-accent/5 rounded-xl">
                <Trophy size={20} weight="fill" className="sm:w-7 sm:h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Club Atletism
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent animate-pulse" />
                  Panou Atlet
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                <Trophy size={16} weight="fill" className="text-accent" />
                <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                <SignOut size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Deconectare</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <DynamicDashboard
          currentUser={currentUser}
          athletes={currentAthlete ? [currentAthlete] : []}
          results={results}
        />
      </main>
    </div>
  );
};

export default AthleteLayout;
