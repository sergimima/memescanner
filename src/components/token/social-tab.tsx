interface SocialMetrics {
  twitter: {
    followers: number;
    engagement: number;
  };
  telegram: {
    members: number;
    activeUsers: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface SocialTabProps {
  metrics: SocialMetrics;
}

export function SocialTab({ metrics }: SocialTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">Twitter</h4>
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Seguidores</span>
              <span>{metrics.twitter.followers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">Engagement</span>
              <span>{metrics.twitter.engagement}%</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Telegram</h4>
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Miembros</span>
              <span>{metrics.telegram.members.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">Usuarios Activos</span>
              <span>{metrics.telegram.activeUsers.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Análisis de Sentimiento</h4>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500" 
            style={{ 
              width: `${metrics.sentiment.positive}%`,
              float: 'left'
            }}
          />
          <div 
            className="h-full bg-yellow-500" 
            style={{ 
              width: `${metrics.sentiment.neutral}%`,
              float: 'left'
            }}
          />
          <div 
            className="h-full bg-red-500" 
            style={{ 
              width: `${metrics.sentiment.negative}%`,
              float: 'left'
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Positivo: {metrics.sentiment.positive}%</span>
          <span>Neutral: {metrics.sentiment.neutral}%</span>
          <span>Negativo: {metrics.sentiment.negative}%</span>
        </div>
      </div>
    </div>
  );
}
