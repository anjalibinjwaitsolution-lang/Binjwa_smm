interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const steps = [
    { number: 1, label: "Brand Inputs" },
    { number: 2, label: "Content Settings" },
    { number: 3, label: "Generate" },
  ]

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-border">
        <div
          className="h-full gradient-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                step.number <= currentStep
                  ? "gradient-primary text-white shadow-lg"
                  : "bg-background border-2 border-border text-foreground-muted"
              }`}
            >
              {step.number}
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                step.number <= currentStep ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
