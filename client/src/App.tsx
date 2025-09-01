import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompaniesSection } from '@/components/CompaniesSection';
import { ContactsSection } from '@/components/ContactsSection';
import { DealsSection } from '@/components/DealsSection';
import { TasksSection } from '@/components/TasksSection';
import { Building2, Users, HandHeart, CheckSquare } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏢 Customer Relationship Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage your customers, deals, and relationships in one place
          </p>
        </div>

        {/* Main CRM Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <HandHeart className="h-4 w-4" />
              Deals
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-6">
            <CompaniesSection />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <ContactsSection />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <DealsSection />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TasksSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;