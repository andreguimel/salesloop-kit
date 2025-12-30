import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Database, Globe, FileText, Scale, CheckCircle } from "lucide-react";

export default function TermosDeUso() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground">Última atualização: Dezembro de 2024</p>
      </div>

      <div className="space-y-6">
        {/* Destaque sobre dados abertos */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              Conformidade com LGPD - Dados Públicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              A plataforma <strong>Achei Leads</strong> opera exclusivamente com <strong>dados públicos e abertos</strong>, 
              disponibilizados por órgãos governamentais brasileiros. Todos os dados empresariais apresentados são de 
              acesso público e não configuram dados pessoais protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            
            <div className="grid gap-3 mt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm">
                  <strong>Dados da Receita Federal:</strong> Informações de CNPJ, razão social, nome fantasia, 
                  CNAE, endereço comercial e situação cadastral são dados públicos disponíveis no portal da Receita Federal.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm">
                  <strong>Dados de Juntas Comerciais:</strong> Registros empresariais disponibilizados publicamente 
                  pelos órgãos estaduais de registro de comércio.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm">
                  <strong>Informações Públicas na Internet:</strong> Dados disponíveis publicamente em websites, 
                  redes sociais empresariais e diretórios públicos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seções do termo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Aceitação dos Termos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ao acessar e utilizar a plataforma Achei Leads, você concorda com estes Termos de Uso. 
              Caso não concorde com qualquer parte destes termos, solicitamos que não utilize nossos serviços. 
              O uso continuado da plataforma constitui aceitação integral destes termos e de quaisquer 
              atualizações futuras.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              2. Natureza dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A plataforma Achei Leads disponibiliza exclusivamente dados empresariais de natureza pública, 
              incluindo mas não se limitando a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• CNPJ e dados cadastrais de pessoas jurídicas</li>
              <li>• Razão social e nome fantasia</li>
              <li>• Endereço comercial registrado</li>
              <li>• Classificação Nacional de Atividades Econômicas (CNAE)</li>
              <li>• Situação cadastral junto à Receita Federal</li>
              <li>• Informações de contato disponibilizadas publicamente pelas empresas</li>
              <li>• Perfis empresariais em redes sociais públicas</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              <strong>Importante:</strong> Não coletamos, armazenamos ou processamos dados pessoais sensíveis 
              ou dados que exijam consentimento do titular nos termos da LGPD. Todos os dados disponibilizados 
              são de domínio público e podem ser acessados por qualquer cidadão através dos portais governamentais oficiais.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              3. Base Legal - LGPD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O tratamento de dados realizado pela plataforma Achei Leads está amparado nas seguintes 
              bases legais previstas na Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Art. 7º, §4º - Dados Tornados Públicos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  "É dispensada a exigência do consentimento previsto no caput deste artigo para os 
                  dados tornados manifestamente públicos pelo titular."
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Art. 7º, IX - Legítimo Interesse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  "Quando necessário para atender aos interesses legítimos do controlador ou de terceiro, 
                  exceto no caso de prevalecerem direitos e liberdades fundamentais do titular."
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Art. 4º, III - Dados de Pessoas Jurídicas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dados de pessoas jurídicas não são considerados dados pessoais nos termos da LGPD, 
                  não estando sujeitos às suas disposições.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              4. Fontes de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Os dados disponibilizados na plataforma são obtidos das seguintes fontes públicas oficiais:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Receita Federal do Brasil - Portal de Dados Abertos</li>
              <li>• Juntas Comerciais Estaduais</li>
              <li>• IBGE - Instituto Brasileiro de Geografia e Estatística</li>
              <li>• Portais de transparência governamentais</li>
              <li>• Websites e perfis empresariais públicos na internet</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              5. Uso Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O usuário se compromete a utilizar os dados disponibilizados de forma ética e em 
              conformidade com a legislação vigente, especialmente:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Não utilizar os dados para práticas de spam ou comunicação não solicitada em massa</li>
              <li>• Respeitar as preferências de contato das empresas</li>
              <li>• Não revender ou redistribuir os dados comercialmente sem autorização</li>
              <li>• Manter a confidencialidade de suas credenciais de acesso</li>
              <li>• Reportar qualquer uso indevido ou vulnerabilidade identificada</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>6. Limitação de Responsabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A plataforma Achei Leads não se responsabiliza pela precisão, completude ou atualização 
              dos dados públicos disponibilizados, uma vez que estes são obtidos de fontes externas. 
              Recomendamos sempre a verificação das informações junto às fontes oficiais antes de 
              tomar decisões comerciais baseadas nos dados apresentados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>7. Alterações nos Termos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
              As alterações entrarão em vigor imediatamente após sua publicação na plataforma. 
              O uso continuado dos serviços após modificações constitui aceitação dos novos termos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>8. Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para dúvidas, solicitações ou esclarecimentos sobre estes Termos de Uso ou sobre 
              o tratamento de dados, entre em contato através dos canais disponíveis na plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
