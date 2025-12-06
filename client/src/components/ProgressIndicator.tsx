import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, title: "Basic Details" },
  { number: 2, title: "Requirements & Documents" },
  { number: 3, title: "Embassy Appointment" },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6 px-4" data-testid="progress-indicator">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isCurrent 
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span 
                  className={`
                    mt-2 text-xs font-medium text-center whitespace-nowrap
                    ${isCurrent ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  Step {step.number}
                </span>
                <span 
                  className={`
                    text-xs text-center
                    ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}
                  `}
                >
                  {step.title}
                </span>
              </div>
              
              {!isLast && (
                <div 
                  className={`
                    flex-1 h-0.5 mx-4 mt-[-24px]
                    ${isCompleted ? "bg-primary" : "bg-muted"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
