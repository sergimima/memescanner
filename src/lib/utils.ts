import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cnCond(condition: boolean, trueClass: ClassValue, falseClass?: ClassValue) {
  return condition ? cn(trueClass) : cn(falseClass);
}
