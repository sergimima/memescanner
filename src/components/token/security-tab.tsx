import { ScoreIndicator } from "../ui/score-indicator";

interface SecurityCheck {
  name: string;
  passed: boolean;
  description: string;
}

interface SecurityTabProps {
  securityScore: number;
  liquidityLocked: {
    amount: string;
    duration: string;
    platform: string;
  };
  checks: SecurityCheck[];
}

export function SecurityTab({ securityScore, liquidityLocked, checks }: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <ScoreIndicator 
          score={securityScore} 
          maxScore={40} 
          label="Puntuación de Seguridad" 
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Liquidez Bloqueada</h4>
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Cantidad</span>
            <span>{liquidityLocked.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duración</span>
            <span>{liquidityLocked.duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plataforma</span>
            <span>{liquidityLocked.platform}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Verificaciones de Seguridad</h4>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.name} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
              <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center
                ${check.passed ? 'bg-green-500' : 'bg-red-500'}`}>
                {check.passed ? '✓' : '✕'}
              </div>
              <div>
                <p className="font-medium">{check.name}</p>
                <p className="text-sm text-muted-foreground">{check.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
