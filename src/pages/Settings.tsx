import { Settings as SettingsIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { CrmStagesSection } from '@/components/settings/CrmStagesSection';

const Settings = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="space-y-2 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            <SettingsIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Configurações
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl">
          Personalize sua experiência e gerencie suas preferências.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary/50">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <ProfileSection />
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesSection />
        </TabsContent>
        
        <TabsContent value="crm" className="space-y-6">
          <CrmStagesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
