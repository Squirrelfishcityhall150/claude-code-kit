/**
 * Plugin manifest schema
 * Defines the structure of plugin.json
 */

export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  keywords?: string[];

  compatibility: {
    claudeCode: string; // Semver range
    node: string; // Semver range
  };

  provides: {
    skills?: string[]; // List of skill directory names
    agents?: string[]; // List of agent file names
    commands?: string[]; // List of command file names
    hooks?: string[]; // List of hook file names
    skillRulesFragment?: string; // Path to skill-rules fragment
  };

  dependencies?: {
    plugins?: string[]; // Other plugins required
    npm?: Record<string, string>; // NPM dependencies and versions
  };

  pathPatterns?: Record<string, string[]>; // Framework detection patterns
  contentPatterns?: Record<string, string[]>; // Content detection patterns

  templates?: {
    paths?: Record<string, string>; // Template variables and defaults
  };

  prompts?: PromptDefinition[]; // Interactive prompts during installation
}

export interface PromptDefinition {
  type: 'input' | 'confirm' | 'list' | 'checkbox';
  name: string;
  message: string;
  default?: any;
  choices?: Array<{ name: string; value: any }>;
  when?: string; // Condition expression
}

/**
 * Skill rules fragment schema
 * Merged into main skill-rules.json
 */
export interface SkillRulesFragment {
  skills: Record<string, SkillRule>;
}

export interface SkillRule {
  type: 'domain' | 'guardrail';
  enforcement: 'suggest' | 'block' | 'warn';
  priority: 'critical' | 'high' | 'medium' | 'low';
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    pathExclusions?: string[];
    contentPatterns?: string[];
  };
}

/**
 * Installed plugin metadata
 */
export interface InstalledPlugin {
  name: string;
  version: string;
  installedAt: string;
  manifest: PluginManifest;
  customPaths?: Record<string, string>;
}
