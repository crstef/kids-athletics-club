import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EnvelopeSimple, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Athlete, AccessRequest, User } from '@/lib/types'

interface ParentAccessRequestProps {
  parentId: string
  athletes: Athlete[]
  coaches: User[]
  accessRequests: AccessRequest[]
  onCreateRequest: (request: Omit<AccessRequest, 'id' | 'requestDate'>) => void
}

export function ParentAccessRequest({ 
  parentId, 
  athletes, 
  coaches,
  accessRequests,
  onCreateRequest 
}: ParentAccessRequestProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [message, setMessage] = useState('')

  const availableAthletes = useMemo(() => {
    const requestedAthleteIds = accessRequests
      .filter(r => r.parentId === parentId && r.status !== 'rejected')
      .map(r => r.athleteId)
    
    return athletes.filter(a => !requestedAthleteIds.includes(a.id) && a.coachId)
  }, [athletes, accessRequests, parentId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAthleteId) {
      toast.error('Selectează un atlet')
      return
    }

    const athlete = athletes.find(a => a.id === selectedAthleteId)
    if (!athlete || !athlete.coachId) {
      toast.error('Atletul selectat nu are un antrenor asociat')
      return
    }

    onCreateRequest({
      parentId,
      athleteId: selectedAthleteId,
      coachId: athlete.coachId,
      status: 'pending',
      message: message.trim() || undefined
    })

    setSelectedAthleteId('')
    setMessage('')
    toast.success('Cerere trimisă cu succes!')
  }

  const myRequests = useMemo(() => {
    return accessRequests.filter(r => r.parentId === parentId)
  }, [accessRequests, parentId])

  const getStatusBadge = (status: AccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock size={14} />În așteptare</Badge>
      case 'approved':
        return <Badge className="gap-1 bg-secondary text-secondary-foreground"><CheckCircle size={14} />Aprobat</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle size={14} />Respins</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeSimple size={24} />
            Cere Acces la Datele Copilului
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete-select">Selectează Atletul</Label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger id="athlete-select">
                  <SelectValue placeholder="Alege atletul..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAthletes.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Nu există atleți disponibili
                    </div>
                  ) : (
                    availableAthletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.firstName} {athlete.lastName} ({athlete.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-message">Mesaj pentru Antrenor (opțional)</Label>
              <Textarea
                id="request-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrie un mesaj pentru antrenor..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={!selectedAthleteId}>
              Trimite Cerere
            </Button>
          </form>
        </CardContent>
      </Card>

      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cererile Mele</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.map((request) => {
                const athlete = athletes.find(a => a.id === request.athleteId)
                const coach = coaches.find(c => c.id === request.coachId)
                
                return (
                  <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {athlete?.firstName} {athlete?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Antrenor: {coach?.firstName} {coach?.lastName}
                      </div>
                      {request.message && (
                        <div className="text-sm text-muted-foreground italic">
                          "{request.message}"
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Trimis: {new Date(request.requestDate).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
