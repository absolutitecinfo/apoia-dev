import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função utilitária para converter empresaId para número, tratando caso "demo"
export function parseEmpresaId(empresaId: string): number {
  if (empresaId.toLowerCase() === 'demo') {
    return 999; // ID fixo para demo
  }
  return parseInt(empresaId);
}
