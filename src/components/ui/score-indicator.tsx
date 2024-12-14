interface ScoreIndicatorProps {
  score: number;
  maxScore: number;
  label: string;
}

export function ScoreIndicator({ score, maxScore, label }: ScoreIndicatorProps) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-muted-foreground">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
