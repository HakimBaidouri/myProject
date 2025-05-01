import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SummarySpreadsheet from './summary/SummarySpreadsheet';
import SummarySpecifications from './summary/SummarySpecifications';

export default function Summary() {
  const [activeTab, setActiveTab] = useState('spreadsheet');

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Project Summary</h1>
      
      <Tabs defaultValue="spreadsheet" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="spreadsheet">Tableur</TabsTrigger>
          <TabsTrigger value="specifications">Cahier des charges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spreadsheet" className="mt-6">
          <SummarySpreadsheet />
        </TabsContent>
        
        <TabsContent value="specifications" className="mt-6">
          <SummarySpecifications />
        </TabsContent>
      </Tabs>
    </div>
  );
} 