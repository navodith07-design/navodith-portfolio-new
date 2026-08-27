import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function FigmaIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="-9.5 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38H19V28.5Z" fill="#1ABCFE"/>
      <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
      <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
      <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
      <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
    </svg>
  );
}

export function FigJamIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#9747FF" />
      <path d="M7 17V7H17M7 12H14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FigmaMakeIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#1E1E1E" />
      <path d="M12 4.5L13.8 8.7L18 10.5L13.8 12.3L12 16.5L10.2 12.3L6 10.5L10.2 8.7L12 4.5Z" fill="#F24E1E" />
      <path d="M17 13.5L17.8 15.3L20 16.1L17.8 16.9L17 19.1L16.2 16.9L14 16.1L16.2 15.3L17 13.5Z" fill="#1ABCFE" />
    </svg>
  );
}

export function RelumeIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#000000" />
      <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">R</text>
    </svg>
  );
}

export function HtmlIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 2L4.8 20.2L12 22L19.2 20.2L21 2H3Z" fill="#E34F26" />
      <path d="M12 3.8V20.2L17.7 18.6L19.2 3.8H12Z" fill="#EF652A" />
      <path d="M7.2 7H16.8L16.5 9.8H10.1L10.3 12.2H16.2L15.6 17.1L12 18.1L8.4 17.1L8.2 14.8H10.4L10.5 15.6L12 16L13.5 15.6L13.7 13.8H7.7L7.2 7Z" fill="white" />
    </svg>
  );
}

export function CssIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 2L4.8 20.2L12 22L19.2 20.2L21 2H3Z" fill="#1572B6" />
      <path d="M12 3.8V20.2L17.7 18.6L19.2 3.8H12Z" fill="#33A9DC" />
      <path d="M16.8 7H7.2L7.4 9.8H14.4L14.1 12.2H7.6L7.8 14.8H13.8L13.5 17.1L12 18.1L10.5 17.1L10.4 15.6H8.2L8.4 17.1L12 18.1L15.6 17.1L16.2 11.2H9.8L9.6 9.8H16.8V7Z" fill="white" />
    </svg>
  );
}

export function JsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="4" fill="#F7DF1E" />
      <path d="M11.5 16.25c0 1.15-.75 1.75-1.92 1.75-1.12 0-1.85-.66-2.22-1.37l1.1-.65c.22.41.58.8 1.12.8.52 0 .82-.26.82-.8V9.5h1.1v6.75zm5.88 0c0 1.25-.92 1.75-2.25 1.75-1.28 0-2.12-.66-2.52-1.42l1.1-.63c.28.48.74.83 1.42.83.56 0 .98-.24.98-.67 0-.46-.38-.63-1.03-.88l-.36-.14c-1.04-.4-1.73-.97-1.73-2.02 0-1.14.92-1.75 2.15-1.75 1.05 0 1.77.46 2.18 1.18l-1.02.62c-.22-.38-.56-.6-.1 1.16 0 .52-.2.37-.52.37-.29 0-.68.12-.68.45 0 .32.22.48.8.7l.36.14c1.23.47 1.8.99 1.8 2.04z" fill="#000000" />
    </svg>
  );
}

export function TailwindIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19.2 12.001 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" fill="#06B6D4" />
    </svg>
  );
}

export function BootstrapIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#7952B3" />
      <path d="M7 6.5H12.2C14 6.5 15.2 7.3 15.2 8.7C15.2 9.7 14.5 10.5 13.5 10.8C14.8 11.2 15.6 12.1 15.6 13.6C15.6 15.3 14.2 16.5 12.1 16.5H7V6.5ZM9.6 8.5V10.5H11.8C12.6 10.5 13.1 10.1 13.1 9.5C13.1 8.9 12.6 8.5 11.8 8.5H9.6ZM9.6 12.3V14.5H12C12.8 14.5 13.4 14 13.4 13.4C13.4 12.8 12.8 12.3 12 12.3H9.6Z" fill="white" />
    </svg>
  );
}

export function JQueryIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#0769AD" />
      <path d="M12 5C8.13 5 5 8.13 5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="white" />
      <path d="M11 9H13V15H11V9Z" fill="white" />
    </svg>
  );
}

export function GitHubIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#0f0f0f" />
    </svg>
  );
}

export function GsapIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#88CE02" />
      <text x="12" y="16" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.5">GSAP</text>
    </svg>
  );
}

export function SplineIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#1E1F29" />
      <path d="M12 4.5L18.5 8.2V15.8L12 19.5L5.5 15.8V8.2L12 4.5Z" stroke="#00F0FF" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12L18.5 8.2M12 12L5.5 8.2M12 12V19.5" stroke="#00F0FF" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function CursorIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#000000" />
      <path d="M6.5 5.5L17.5 12L12 13.5L9.5 18.5L6.5 5.5Z" fill="#FFFFFF" />
    </svg>
  );
}

export function GoogleAiStudioIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#google_ai_grad)" />
      <defs>
        <linearGradient id="google_ai_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.33" stopColor="#34A853" />
          <stop offset="0.66" stopColor="#FBBC05" />
          <stop offset="1" stopColor="#EA4335" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GeminiIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2C12 7.523 16.477 12 22 12C16.477 12 12 16.477 12 22C12 16.477 7.523 12 2 12C7.523 12 12 7.523 12 2Z" fill="url(#gemini_grad)" />
      <defs>
        <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1A73E8" />
          <stop offset="0.5" stopColor="#8AB4F8" />
          <stop offset="1" stopColor="#C58AF9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ClaudeIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#D97757" />
      <path d="M12 4.5L13.8 9.2L18.5 11L13.8 12.8L12 17.5L10.2 12.8L5.5 11L10.2 9.2L12 4.5Z" fill="#FFFFFF" />
      <path d="M12 7.5L12.9 10.1L15.5 11L12.9 11.9L12 14.5L11.1 11.9L8.5 11L11.1 10.1L12 7.5Z" fill="#D97757" />
    </svg>
  );
}

export function PhotoshopIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#001E36" stroke="#31A8FF" strokeWidth="1" />
      <text x="12" y="16.5" textAnchor="middle" fill="#31A8FF" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">Ps</text>
    </svg>
  );
}

export function IllustratorIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#330000" stroke="#FF9A00" strokeWidth="1" />
      <text x="12" y="16.5" textAnchor="middle" fill="#FF9A00" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">Ai</text>
    </svg>
  );
}

export function AfterEffectsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="5" fill="#00005B" stroke="#9999FF" strokeWidth="1" />
      <text x="12" y="16.5" textAnchor="middle" fill="#9999FF" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">Ae</text>
    </svg>
  );
}

