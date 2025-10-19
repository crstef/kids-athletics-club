import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { hashPassword, verifyPassword } from '@/lib/crypto'
import type { User, UserRole, AccountApprovalRequest } from '@/lib/types'

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  onLogin: (user: User) => void
}

export function AuthDialog({ open, onClose, onLogin }: AuthDialogProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [approvalRequests, setApprovalRequests] = useKV<AccountApprovalRequest[]>('approval-requests', [])
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupLastName, setSignupLastName] = useState('')
  const [signupRole, setSignupRole] = useState<UserRole>('parent')
  const [signupSpecialization, setSignupSpecialization] = useState('')
  const [childName, setChildName] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Introdu email și parolă')
      return
    }

    const user = (users || []).find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim())
    
    if (!user) {
      toast.error('Email sau parolă incorectă')
      return
    }

    const passwordMatch = await verifyPassword(loginPassword, user.password)
    
    if (passwordMatch) {
      if (!user.isActive) {
        if (user.needsApproval) {
          toast.error('Contul tău așteaptă aprobare de la administrator')
        } else {
          toast.error('Contul tău este dezactivat. Contactează administratorul.')
        }
        return
      }
      onLogin(user)
      toast.success(`Bine ai revenit, ${user.firstName}!`)
      onClose()
      resetForms()
    } else {
      toast.error('Email sau parolă incorectă')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupEmail.trim() || !signupPassword || !signupFirstName.trim() || !signupLastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (signupRole === 'parent' && !childName.trim()) {
      toast.error('Specifică numele copilului pentru care soliciți acces')
      return
    }

    if (signupPassword.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Parolele nu corespund')
      return
    }

    const emailExists = (users || []).some(u => u.email.toLowerCase() === signupEmail.toLowerCase().trim())
    
    if (emailExists) {
      toast.error('Emailul este deja înregistrat')
      return
    }

    const hashedPassword = await hashPassword(signupPassword)

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: signupEmail.trim(),
      password: hashedPassword,
      firstName: signupFirstName.trim(),
      lastName: signupLastName.trim(),
      role: signupRole,
      createdAt: new Date().toISOString(),
      isActive: signupRole === 'superadmin',
      needsApproval: signupRole !== 'superadmin'
    }

    if (signupRole === 'coach' && signupSpecialization.trim()) {
      (newUser as any).specialization = signupSpecialization.trim()
    }

    setUsers((current) => [...(current || []), newUser])

    if (signupRole !== 'superadmin') {
      const approvalRequest: AccountApprovalRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: newUser.id,
        requestedRole: signupRole,
        status: 'pending',
        requestDate: new Date().toISOString(),
        childName: childName.trim() || undefined,
        approvalNotes: approvalNotes.trim() || undefined
      }
      setApprovalRequests((current) => [...(current || []), approvalRequest])
      toast.info('Contul tău așteaptă aprobare de la administrator')
    } else {
      onLogin(newUser)
    }
    
    toast.success(`Cont creat cu succes! ${newUser.firstName}!`)
    onClose()
    resetForms()
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
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="font-semibold text-sm mb-2 text-primary">📋 Acces SuperAdmin:</div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <code className="bg-primary/20 px-2 py-0.5 rounded text-primary font-mono text-xs">
                    admin@clubatletism.ro
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Parolă:</span>
                  <code className="bg-primary/20 px-2 py-0.5 rounded text-primary font-mono text-xs">
                    admin123
                  </code>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Introdu credențialele de mai sus pentru a accesa panoul SuperAdmin
                </div>
              </div>
            </div>
            
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
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm text-accent">ℹ️ Informații Părinte:</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Contul va necesita aprobare de la administrator</p>
                    <p>• Vei primi notificare când contul este aprobat</p>
                    <p>• Specifică pentru ce copil soliciți acces</p>
                  </div>
                </div>
              )}

              {signupRole === 'athlete' && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm text-primary">ℹ️ Informații Atlet:</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Contul necesită aprobare de la antrenor</p>
                    <p>• Antrenorul va asocia profilul tău la profilul din sistem</p>
                    <p>• Vei avea acces la rezultatele și statisticile tale</p>
                  </div>
                </div>
              )}

              {signupRole === 'coach' && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm text-secondary-foreground">ℹ️ Informații Antrenor:</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Contul necesită aprobare de la administrator</p>
                    <p>• După aprobare vei putea gestiona atleți</p>
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
                  <Label htmlFor="signup-child-name">Nume Copil *</Label>
                  <Input
                    id="signup-child-name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="ex: Maria Popescu"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Numele copilului pentru care soliciți acces
                  </p>
                </div>
              )}

              {(signupRole === 'parent' || signupRole === 'athlete') && (
                <div className="space-y-2">
                  <Label htmlFor="signup-notes">Notițe Aprobare (opțional)</Label>
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
