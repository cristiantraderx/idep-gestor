import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BensPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bens Patrimoniais</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Bens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default BensPage;
