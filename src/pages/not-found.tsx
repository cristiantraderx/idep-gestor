import { useNavigate } from "react-router-dom";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-sm text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
              Verifique o endereço ou navegue pelo menu lateral.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
