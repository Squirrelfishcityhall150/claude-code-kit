/**
 * CLI configuration types
 */

import { InstalledPlugin } from './plugin';

/**
 * Project-level CLI config (.claude-code-cli.json)
 */
export interface CLIConfig {
  version: string;
  installedAt: string;
  plugins: InstalledPlugin[];
  customPaths: Record<string, string>;
  settings?: {
    autoUpdate?: boolean;
    analyticsEnabled?: boolean;
  };
}

/**
 * Detected project structure
 */
export interface DetectedProject {
  type: 'frontend' | 'backend' | 'fullstack' | 'monorepo' | 'unknown';
  frontend?: FrontendInfo;
  backend?: BackendInfo;
  monorepo?: MonorepoInfo;
  rootPath: string;
}

export interface FrontendInfo {
  framework: 'react' | 'nextjs' | 'vue' | 'svelte' | 'angular' | null;
  directory: string;
  hasTypeScript: boolean;
  hasMUI: boolean;
  hasShadcn: boolean;
  hasTailwind: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface BackendInfo {
  framework: 'express' | 'fastify' | 'nextjs-api' | 'nest' | 'koa' | null;
  directory: string;
  hasTypeScript: boolean;
  hasPrisma: boolean;
  hasSentry: boolean;
  hasKeycloak: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface MonorepoInfo {
  tool: 'turborepo' | 'nx' | 'lerna' | 'pnpm-workspaces' | 'yarn-workspaces' | null;
  packages: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

/**
 * Init command options
 */
export interface InitOptions {
  frontend?: string; // Plugin name
  backend?: string; // Plugin name
  plugins?: string[]; // Additional plugins
  preset?: string; // Preset configuration
  yes?: boolean; // Skip prompts, use defaults
  force?: boolean; // Overwrite existing .claude directory
  detectOnly?: boolean; // Only detect, don't install
}

/**
 * Add command options
 */
export interface AddOptions {
  plugin?: string; // Add from specific plugin
  type?: 'skill' | 'agent' | 'command' | 'hook';
}

/**
 * Plugin command options
 */
export interface PluginOptions {
  installed?: boolean; // List only installed
  upgrade?: boolean; // Upgrade to latest version
}

/**
 * Update command options
 */
export interface UpdateOptions {
  detect?: boolean; // Auto-detect and update paths
  upgrade?: boolean; // Upgrade plugins to latest
  paths?: boolean; // Update only path patterns
}
