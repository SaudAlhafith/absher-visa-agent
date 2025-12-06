import { type LucideIcon } from "lucide-react";

interface IconContainerProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconContainer({ icon: Icon, size = "md", className = "" }: IconContainerProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-card 
        shadow-md 
        flex items-center justify-center
        ${className}
      `}
    >
      <Icon className={`${iconSizes[size]} text-primary`} />
    </div>
  );
}
