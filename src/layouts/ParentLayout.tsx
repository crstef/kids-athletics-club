import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { SignOut, Trophy } from '@phosphor-icons/react';
import { DynamicDashboard } from '@/components/DynamicDashboard';
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog';
import { User, Athlete, Result, AccessRequest, Message } from '@/lib/types';

interface ParentLayoutProps {
  currentUser: User;
  logout: () => void;
  athletes: Athlete[];
  results: Result[];
  accessRequests: AccessRequest[];
  coaches: User[];
  messages: Message[];
  handleCreateAccessRequest: (requestData: Omit<AccessRequest, 'id' | 'requestDate'>) => Promise<void>;
  handleSendMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  handleMarkAsRead: (messageIds: string[]) => Promise<void>;
  setSelectedAthlete: (athlete: Athlete | null) => void;
  selectedAthlete: Athlete | null;
  handleCloseAthleteDialog: () => void;
  handleAddResult: (resultData: Omit<Result, 'id'>) => Promise<void>;
  handleUpdateResult: (id: string, updates: Partial<Result>) => Promise<void>;
  handleDeleteResult: (id: string) => Promise<void>;
  handleUploadAthleteAvatar: (id: string, file: File) => Promise<void>;
  selectedAthleteTab: 'results' | 'evolution';
}

const ParentLayout: React.FC<ParentLayoutProps> = ({
  currentUser,
  logout,
  athletes,
  results,
  accessRequests,
  coaches,
  messages,
  handleCreateAccessRequest,
  handleSendMessage,
  handleMarkAsRead,
  setSelectedAthlete,
  selectedAthlete,
  handleCloseAthleteDialog,
  handleAddResult,
  handleUpdateResult,
  handleDeleteResult,
  handleUploadAthleteAvatar,
  selectedAthleteTab,
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
                  Panou Părinte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-secondary" />
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
          athletes={athletes}
          results={results}
          accessRequests={accessRequests}
          messages={messages}
          onViewAthleteDetails={setSelectedAthlete}
        />
      </main>

      <AthleteDetailsDialog
        athlete={selectedAthlete}
        results={results}
        onClose={handleCloseAthleteDialog}
        onAddResult={handleAddResult}
        onUpdateResult={handleUpdateResult}
        onDeleteResult={handleDeleteResult}
        onUploadAvatar={handleUploadAthleteAvatar}
        defaultTab={selectedAthleteTab}
      />
    </div>
  );
};

export default ParentLayout;
