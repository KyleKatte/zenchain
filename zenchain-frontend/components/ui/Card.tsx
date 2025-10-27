/**
 * Card Component - Neumorphic style
 */

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "raised" | "flat" | "pressed";
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "raised",
  padding = "md",
  hover = false,
  className = "",
  ...props
}) => {
  const baseClasses = "card-neumorphic rounded-xl";

  const variantClasses = {
    raised: "",
    flat: "shadow-neumorphicFlat",
    pressed: "shadow-neumorphicPressed",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClass = hover ? "hover:shadow-neumorphicFlat transition-shadow duration-300 cursor-pointer" : "";

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};





