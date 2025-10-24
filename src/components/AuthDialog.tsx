import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import { useUsers, useAthletes, usePublicCoaches } from '@/hooks/use-api'
import { useAuth } from '@/lib/auth-context'
import type { User, UserRole } from '@/lib/types'

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  onLogin: (user: User) => void
}

export function AuthDialog({ open, onClose, onLogin }: AuthDialogProps) {
  const { rememberMe, setRememberMe } = useAuth()
  const [_users, _setUsers, _usersLoading] = useUsers({ autoFetch: false});
  const [athletes, _setAthletes, _athletesLoading] = useAthletes({ autoFetch: false });
  const [coaches, _setCoaches, _coachesLoading, _coachesError, refetchCoaches] = usePublicCoaches();
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRememberMe, setLoginRememberMe] = useState(rememberMe)
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupLastName, setSignupLastName] = useState('')
  const [signupRole, setSignupRole] = useState<UserRole>('parent')
  const [signupSpecialization, setSignupSpecialization] = useState('')
  const [selectedCoachId, setSelectedCoachId] = useState<string>('')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [childName, setChildName] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const athletesByCoach = useMemo(() => {
    if (!selectedCoachId) return []
    return (athletes || []).filter(a => a.coachId === selectedCoachId)
  }, [athletes, selectedCoachId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Introdu email și parolă')
      return
    }

    try {
      const user = await apiClient.login(loginEmail.trim(), loginPassword)
      // Save remember me preference
      setRememberMe(loginRememberMe)
      onLogin(user)
      toast.success(`Bine ai revenit, ${user.firstName}!`)
      onClose()
      resetForms()
    } catch (error: any) {
      if (error.message?.includes('pending approval')) {
        toast.error('Contul tău așteaptă aprobată de la administrator')
      } else if (error.message?.includes('inactive')) {
        toast.error('Contul tău este dezactivat. Contactează administratorul.')
      } else {
        toast.error(error.message || 'Email sau parolă incorectă')
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupEmail.trim() || !signupPassword || !signupFirstName.trim() || !signupLastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (signupRole === 'parent') {
      if (!selectedCoachId) {
        toast.error('Selectează antrenorul copilului tău')
        return
      }
      if (!selectedAthleteId) {
        toast.error('Selectează copilul tău din listă')
        return
      }
    }

    if (signupPassword.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Parolele nu corespund')
      return
    }

    try {
      const selectedAthlete = athletesByCoach.find(a => a.id === selectedAthleteId)
      
      const userData = {
        email: signupEmail.trim(),
        password: signupPassword,
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        role: signupRole,
        specialization: signupRole === 'coach' ? signupSpecialization.trim() : undefined,
        coachId: selectedCoachId || undefined,
        athleteId: selectedAthleteId || undefined,
        childName: selectedAthlete ? `${selectedAthlete.firstName} ${selectedAthlete.lastName}` : childName.trim() || undefined,
        approvalNotes: approvalNotes.trim() || undefined
      }

      await apiClient.register(userData)
      
      if (signupRole !== 'superadmin') {
        if (signupRole === 'parent') {
          toast.info('Cererea ta a fost trimisă la antrenor pentru aprobată')
        } else {
          toast.info('Contul tău așteaptă aprobată de la administrator')
        }
      }
      
      toast.success('Cont creat cu succes!')
      onClose()
      resetForms()
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        toast.error('Emailul este deja înregistrat')
      } else {
        toast.error(error.message || 'Eroare la crearea contului')
      }
    }
  }

  const resetForms = () => {
    setLoginEmail('')
    setLoginPassword('')
    setSignupEmail('')
    setSignupPassword('')
    setSignupConfirmPassword('')
    setSignupFirstName('')
    setSignupLastName('')
    setSignupRole('parent')
    setSignupSpecialization('')
    setSelectedCoachId('')
    setSelectedAthleteId('')
    setChildName('')
    setApprovalNotes('')
    setShowLoginPassword(false)
    setShowSignupPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Autentificare</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Autentificare</TabsTrigger>
            <TabsTrigger value="signup">Înregistrare</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="exemplu@email.ro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Parolă</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? (
                      <EyeSlash size={18} className="text-muted-foreground" />
                    ) : (
                      <Eye size={18} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  checked={loginRememberMe}
                  onCheckedChange={(checked) => setLoginRememberMe(checked === true)}
                />
                <Label 
                  htmlFor="remember-me" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Ține-mă minte (fără auto-logout)
                </Label>
              </div>
              
              <Button type="submit" className="w-full">
                Autentificare
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-role">Tip Cont *</Label>
                <Select value={signupRole} onValueChange={(v) => setSignupRole(v as UserRole)}>
                  <SelectTrigger id="signup-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Părinte</SelectItem>
                    <SelectItem value="athlete">Atlet</SelectItem>
                    <SelectItem value="coach">Antrenor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {signupRole === 'parent' && (
                <>
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
                    <div className="font-semibold text-sm text-foreground">ℹ️ Informații Părinte:</div>
                    <div className="text-sm text-foreground space-y-1">
                      <p>• Selectează antrenorul copilului tău din listă</p>
                      <p>• Apoi selectează copilul din lista antrenorului</p>
                      <p>• Cererea va fi trimisă la antrenor pentru aprobată</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-coach">Selectează Antrenorul *</Label>
                    <Select value={selectedCoachId} onValueChange={(v) => {
                      setSelectedCoachId(v)
                      setSelectedAthleteId('')
                    }}>
                      <SelectTrigger id="signup-coach">
                        <SelectValue placeholder="Alege antrenorul..." />
                      </SelectTrigger>
                      <SelectContent>
                        {_coachesLoading ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Se încarcă...
                          </div>
                        ) : coaches.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Nu există antrenori disponibili
                          </div>
                        ) : (
                          coaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCoachId && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-athlete">Selectează Copilul *</Label>
                      <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                        <SelectTrigger id="signup-athlete">
                          <SelectValue placeholder="Alege copilul..." />
                        </SelectTrigger>
                        <SelectContent>
                          {athletesByCoach.length === 0 ? (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              Acest antrenor nu are atleți înregistrați
                            </div>
                          ) : (
                            athletesByCoach.map((athlete) => (
                              <SelectItem key={athlete.id} value={athlete.id}>
                                {`${athlete.firstName} ${athlete.lastName} (${athlete.category})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {signupRole === 'athlete' && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm text-foreground">ℹ️ Informații Atlet:</div>
                  <div className="text-sm text-foreground space-y-1">
                    <p>• Contul necesită aprobată de la antrenor</p>
                    <p>• Antrenorul va asocia profilul tău la profilul din sistem</p>
                    <p>• Vei avea acces la rezultatele și statisticile tale</p>
                  </div>
                </div>
              )}

              {signupRole === 'coach' && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm text-foreground">ℹ️ Informații Antrenor:</div>
                  <div className="text-sm text-foreground space-y-1">
                    <p>• Contul necesită aprobată de la administrator</p>
                    <p>• După aprobată vei putea gestiona atleți</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName">Prenume *</Label>
                  <Input
                    id="signup-firstName"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="Ion"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName">Nume *</Label>
                  <Input
                    id="signup-lastName"
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="Popescu"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="exemplu@email.ro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Parolă *</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minim 6 caractere"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                  >
                    {showSignupPassword ? (
                      <EyeSlash size={18} className="text-muted-foreground" />
                    ) : (
                      <Eye size={18} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirmă Parola *</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Reintroduceți parola"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash size={18} className="text-muted-foreground" />
                    ) : (
                      <Eye size={18} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {signupRole === 'parent' && (
                <div className="space-y-2">
                  <Label htmlFor="signup-notes">Notițe Aprobată (opțional)</Label>
                  <Input
                    id="signup-notes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="ex: Informații suplimentare..."
                  />
                </div>
              )}

              {signupRole === 'athlete' && (
                <div className="space-y-2">
                  <Label htmlFor="signup-notes">Notițe Aprobată (opțional)</Label>
                  <Input
                    id="signup-notes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="ex: Informații suplimentare..."
                  />
                </div>
              )}

              {signupRole === 'coach' && (
                <div className="space-y-2">
                  <Label htmlFor="signup-specialization">Specializare (opțional)</Label>
                  <Input
                    id="signup-specialization"
                    value={signupSpecialization}
                    onChange={(e) => setSignupSpecialization(e.target.value)}
                    placeholder="ex: Sprint, Sărituri, etc."
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full">
                Înregistrare
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
