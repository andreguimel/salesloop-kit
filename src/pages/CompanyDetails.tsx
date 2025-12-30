import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Instagram, 
  Facebook, 
  Linkedin,
  Sparkles,
  Loader2,
  Calendar,
  FileText,
  History,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  ExternalLink,
  Plus,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PhoneStatusBadge } from '@/components/PhoneStatusBadge';
import { CrmStageHistory } from '@/components/CrmStageHistory';
import { EditCompanyForm } from '@/components/EditCompanyForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { enrichCompany, addPhoneToCompany, deletePhone } from '@/lib/api';
import { Company, Phone as PhoneType } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Phone management state
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneType, setNewPhoneType] = useState<'mobile' | 'landline'>('mobile');
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
  const [deletingPhoneId, setDeletingPhoneId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch company with phones
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select(`
          *,
          company_phones (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (companyError) throw companyError;
      
      if (!companyData) {
        toast.error('Empresa não encontrada');
        navigate('/buscar');
        return;
      }

      const mappedCompany: Company = {
        id: companyData.id,
        name: companyData.name,
        cnpj: companyData.cnpj || undefined,
        cnae: companyData.cnae,
        cnaeDescription: companyData.cnae_description || '',
        city: companyData.city,
        state: companyData.state,
        address: companyData.address || undefined,
        cep: companyData.cep || undefined,
        segment: companyData.segment || '',
        website: companyData.website || undefined,
        email: companyData.email || undefined,
        instagram: companyData.instagram || undefined,
        facebook: companyData.facebook || undefined,
        linkedin: companyData.linkedin || undefined,
        aiSummary: companyData.ai_summary || undefined,
        enrichedAt: companyData.enriched_at || undefined,
        phones: companyData.company_phones.map((p: { id: string; phone_number: string; phone_type: string; status: string }) => ({
          id: p.id,
          number: p.phone_number,
          type: p.phone_type as 'mobile' | 'landline',
          status: p.status as 'valid' | 'uncertain' | 'invalid' | 'pending',
        })),
        messageStatus: 'none' as const,
      };

      setCompany(mappedCompany);


    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrich = async () => {
    if (!company) return;
    
    setIsEnriching(true);
    try {
      await enrichCompany(company);
      toast.success('Empresa enriquecida com sucesso!');
      loadCompanyData();
    } catch (error) {
      console.error('Error enriching:', error);
      toast.error('Erro ao enriquecer empresa');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    loadCompanyData();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleAddPhone = async () => {
    if (!company || !newPhoneNumber.trim()) return;
    
    setIsSubmittingPhone(true);
    try {
      const cleanedNumber = newPhoneNumber.replace(/\D/g, '');
      if (cleanedNumber.length < 10 || cleanedNumber.length > 11) {
        toast.error('Número de telefone inválido');
        return;
      }
      
      await addPhoneToCompany(company.id, cleanedNumber, newPhoneType, 'pending');
      toast.success('Telefone adicionado com sucesso!');
      setNewPhoneNumber('');
      setIsAddingPhone(false);
      loadCompanyData();
    } catch (error) {
      console.error('Error adding phone:', error);
      toast.error('Erro ao adicionar telefone');
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  const handleDeletePhone = async (phoneId: string) => {
    setDeletingPhoneId(phoneId);
    try {
      await deletePhone(phoneId);
      toast.success('Telefone removido com sucesso!');
      loadCompanyData();
    } catch (error) {
      console.error('Error deleting phone:', error);
      toast.error('Erro ao remover telefone');
    } finally {
      setDeletingPhoneId(null);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatCnpj = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviada';
      case 'delivered': return 'Entregue';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando empresa...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 animate-fade-up">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/buscar')}
          className="w-fit gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{company.name}</h1>
            {company.cnpj && (
              <code className="text-sm font-mono text-muted-foreground">
                CNPJ: {formatCnpj(company.cnpj)}
              </code>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
            
            <Button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="gap-2 gradient-primary hover:opacity-90"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {company.enrichedAt ? 'Buscar novamente' : 'Buscar com IA'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <EditCompanyForm 
          company={company} 
          onSave={handleSaveEdit} 
          onCancel={handleCancelEdit} 
        />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
        {/* Company Info Card */}
        <Card className="glass animate-fade-up" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.cnae && (
              <div>
                <span className="text-sm text-muted-foreground">CNAE</span>
                <p className="font-mono text-sm">{company.cnae}</p>
                {company.cnaeDescription && (
                  <p className="text-sm text-muted-foreground">{company.cnaeDescription}</p>
                )}
              </div>
            )}
            
            {company.segment && (
              <div>
                <span className="text-sm text-muted-foreground">Segmento</span>
                <p>{company.segment}</p>
              </div>
            )}

            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Localização
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => {
                    const query = encodeURIComponent(
                      `${company.name} ${company.address || ''} ${company.city} ${company.state}`.trim()
                    );
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Google Maps
                </Button>
              </div>
              <p>{company.city}, {company.state}</p>
              {company.address && (
                <p className="text-sm text-muted-foreground">{company.address}</p>
              )}
              {company.cep && (
                <p className="text-sm text-muted-foreground">CEP: {company.cep}</p>
              )}
            </div>

            <Separator />
            <Button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="w-full gap-2 gradient-primary hover:opacity-90"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando dados...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {company.enrichedAt ? 'Buscar novamente com IA' : 'Buscar com IA'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="glass animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Telefones</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => setIsAddingPhone(!isAddingPhone)}
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              
              {/* Add phone form */}
              {isAddingPhone && (
                <div className="flex flex-col gap-2 p-3 rounded-md bg-muted/50 mb-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="(00) 00000-0000"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Select value={newPhoneType} onValueChange={(v) => setNewPhoneType(v as 'mobile' | 'landline')}>
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">Celular</SelectItem>
                        <SelectItem value="landline">Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setIsAddingPhone(false);
                        setNewPhoneNumber('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddPhone}
                      disabled={isSubmittingPhone || !newPhoneNumber.trim()}
                    >
                      {isSubmittingPhone ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Salvar'
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {company.phones.length > 0 ? (
                <div className="space-y-2">
                  {company.phones.map((phone) => (
                    <div key={phone.id || phone.number} className="flex items-center gap-2 group">
                      {phone.status === 'valid' ? (
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      )}
                      <a 
                        href={phone.status === 'valid' ? `https://wa.me/55${phone.number.replace(/\D/g, '')}` : `tel:${phone.number}`}
                        target={phone.status === 'valid' ? '_blank' : undefined}
                        rel={phone.status === 'valid' ? 'noopener noreferrer' : undefined}
                        className="font-mono text-sm hover:text-primary transition-colors flex-1"
                      >
                        {formatPhone(phone.number)}
                      </a>
                      <PhoneStatusBadge phone={phone} />
                      {phone.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePhone(phone.id!)}
                          disabled={deletingPhoneId === phone.id}
                        >
                          {deletingPhoneId === phone.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado</p>
              )}
            </div>

            <Separator />

            {/* Digital Contacts */}
            <div className="space-y-3">
              {company.website && (
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              
              {company.email && (
                <a 
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {company.email}
                </a>
              )}

              <div className="flex items-center gap-3 pt-2">
                {company.instagram && (
                  <a 
                    href={company.instagram.startsWith('http') ? company.instagram : `https://instagram.com/${company.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-pink-500 transition-colors"
                    title={company.instagram}
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {company.facebook && (
                  <a 
                    href={company.facebook.startsWith('http') ? company.facebook : `https://facebook.com/${company.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-600 transition-colors"
                    title={company.facebook}
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {company.linkedin && (
                  <a 
                    href={company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-700 transition-colors"
                    title={company.linkedin}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
              </div>

              {!company.website && !company.email && !company.instagram && !company.facebook && !company.linkedin && (
                <p className="text-sm text-muted-foreground">
                  {company.enrichedAt ? 'Nenhum contato digital encontrado' : 'Use "Buscar com IA" para encontrar contatos'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Card */}
      {company.aiSummary && (
        <Card className="glass animate-fade-up" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resumo da IA
            </CardTitle>
            <CardDescription>
              Informações encontradas automaticamente sobre a empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{company.aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* CRM Stage History */}
      <CrmStageHistory companyId={company.id} />
        </>
      )}
    </div>
  );
};

export default CompanyDetails;
