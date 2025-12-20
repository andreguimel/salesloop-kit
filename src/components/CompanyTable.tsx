import { useState } from 'react';
import { MapPin, Building2, Phone as PhoneIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneStatusBadge } from './PhoneStatusBadge';
import { MessageStatusBadge } from './MessageStatusBadge';
import { Company, Phone } from '@/types';
import { cn } from '@/lib/utils';

interface CompanyTableProps {
  companies: Company[];
  onSelectPhones: (companyId: string, phones: string[]) => void;
  selectedPhones: Record<string, string[]>;
}

export function CompanyTable({ companies, onSelectPhones, selectedPhones }: CompanyTableProps) {
  const handlePhoneToggle = (companyId: string, phoneNumber: string, isValid: boolean) => {
    if (!isValid) return;
    
    const currentSelection = selectedPhones[companyId] || [];
    const newSelection = currentSelection.includes(phoneNumber)
      ? currentSelection.filter((p) => p !== phoneNumber)
      : [...currentSelection, phoneNumber];
    
    onSelectPhones(companyId, newSelection);
  };

  const handleSelectAllValid = (company: Company) => {
    const validPhones = company.phones
      .filter((p) => p.status === 'valid')
      .map((p) => p.number);
    onSelectPhones(company.id, validPhones);
  };

  if (companies.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
            <p className="text-sm">Use os filtros acima para buscar empresas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm animate-fade-in overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Empresas Encontradas
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {companies.length} resultado{companies.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Empresa</TableHead>
                <TableHead>CNAE</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Telefones</TableHead>
                <TableHead>Status Envio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company, index) => (
                <TableRow 
                  key={company.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-muted-foreground">{company.segment}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{company.cnae}</div>
                    <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {company.cnaeDescription}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {company.city}, {company.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {company.phones.map((phone) => (
                        <div key={phone.number} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedPhones[company.id]?.includes(phone.number) || false}
                            onCheckedChange={() => handlePhoneToggle(company.id, phone.number, phone.status === 'valid')}
                            disabled={phone.status !== 'valid'}
                            className={cn(
                              phone.status !== 'valid' && 'opacity-50 cursor-not-allowed'
                            )}
                          />
                          <PhoneStatusBadge phone={phone} />
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <MessageStatusBadge status={company.messageStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllValid(company)}
                      className="text-xs"
                    >
                      Selecionar válidos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
