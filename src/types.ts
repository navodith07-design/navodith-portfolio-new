export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  description?: string;
  image: string;
  video?: string;
  link?: string;
  tags: string[];
  client?: string;
  services?: string[];
  deliverables?: string[];
  metric?: string;
  featured?: boolean;
}

export interface DesignTokenPreset {
  id: string;
  name: string;
  radius: "none" | "minimal" | "sleek" | "organic";
  spacing: "dense" | "perfect" | "airy";
  density: "compact" | "balanced" | "expanded";
  border: "sharp" | "dashed" | "double" | "none";
}
