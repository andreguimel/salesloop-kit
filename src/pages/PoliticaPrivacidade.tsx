import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Lock, Eye, UserCheck, Bell, Trash2, Mail } from "lucide-react";

export default function PoliticaPrivacidade() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: Dezembro de 2024</p>
      </div>

      <div className="space-y-6">
        {/* Destaque sobre compromisso */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              Nosso Compromisso com sua Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              A <strong>Achei Leads</strong> está comprometida com a proteção da privacidade de seus usuários. 
              Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais, 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              1. Dados que Coletamos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">1.1 Dados do Usuário (Você)</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Para utilização da plataforma, coletamos:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Email para autenticação e comunicação</li>
                <li>• Nome completo (opcional)</li>
                <li>• Telefone para contato (opcional)</li>
                <li>• CPF para emissão de notas fiscais (quando aplicável)</li>
                <li>• Dados de uso e navegação na plataforma</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">1.2 Dados Empresariais Disponibilizados</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Os dados de empresas disponibilizados na plataforma são <strong>exclusivamente dados públicos</strong>, 
                obtidos de fontes governamentais oficiais como a Receita Federal, Juntas Comerciais e portais de 
                transparência. Estes dados não são considerados dados pessoais nos termos da LGPD, pois referem-se 
                a pessoas jurídicas e são de domínio público.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              2. Como Utilizamos seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Utilizamos seus dados pessoais para as seguintes finalidades:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <strong>Autenticação:</strong> Permitir acesso seguro à sua conta</li>
              <li>• <strong>Prestação do serviço:</strong> Fornecer as funcionalidades da plataforma</li>
              <li>• <strong>Comunicação:</strong> Enviar notificações sobre sua conta, atualizações e suporte</li>
              <li>• <strong>Faturamento:</strong> Processar pagamentos e emitir documentos fiscais</li>
              <li>• <strong>Melhorias:</strong> Analisar uso para aprimorar nossos serviços</li>
              <li>• <strong>Segurança:</strong> Detectar e prevenir atividades fraudulentas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              3. Proteção dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <div className="grid gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Criptografia</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os dados são transmitidos via HTTPS com criptografia TLS. 
                  Senhas são armazenadas com hash seguro.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Controle de Acesso</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acesso aos dados é restrito apenas a funcionários autorizados 
                  que necessitam das informações para suas funções.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Infraestrutura Segura</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilizamos provedores de nuvem com certificações de segurança 
                  reconhecidas internacionalmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              4. Seus Direitos (LGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conforme a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e obter cópia</li>
              <li>• <strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
              <li>• <strong>Anonimização ou Eliminação:</strong> Solicitar anonimização ou exclusão de dados desnecessários</li>
              <li>• <strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li>• <strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li>• <strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Para exercer qualquer destes direitos, entre em contato através dos canais indicados nesta política.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              5. Cookies e Tecnologias Similares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Manter você autenticado durante a sessão</li>
              <li>• Lembrar suas preferências (como tema escuro/claro)</li>
              <li>• Analisar o uso da plataforma para melhorias</li>
              <li>• Garantir a segurança da sua conta</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              6. Retenção e Exclusão de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Mantemos seus dados pessoais pelo tempo necessário para:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Fornecer os serviços contratados</li>
              <li>• Cumprir obrigações legais e regulatórias</li>
              <li>• Resolver disputas e fazer cumprir acordos</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Após o encerramento da conta, manteremos dados por até 5 anos para fins fiscais e legais, 
              após o que serão eliminados ou anonimizados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>7. Compartilhamento de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Não vendemos seus dados pessoais. Podemos compartilhar informações apenas com:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>Processadores de pagamento:</strong> Para processar transações financeiras</li>
              <li>• <strong>Provedores de infraestrutura:</strong> Para hospedagem e operação da plataforma</li>
              <li>• <strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Todos os terceiros com quem compartilhamos dados estão sujeitos a acordos de 
              confidencialidade e proteção de dados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>8. Alterações nesta Política</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
              alterações significativas através do email cadastrado ou por aviso na plataforma. 
              Recomendamos revisar esta página regularmente.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              9. Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para dúvidas sobre esta Política de Privacidade, exercício de direitos ou qualquer 
              assunto relacionado à proteção de dados, entre em contato através dos canais 
              disponíveis na plataforma ou nas configurações da sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
