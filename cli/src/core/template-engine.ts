/**
 * Template Engine - Variable substitution and file templating
 */

import Handlebars from 'handlebars';

export interface TemplateContext {
  [key: string]: string | number | boolean | object;
}

export class TemplateEngine {
  private static readonly VARIABLE_PATTERN = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;

  /**
   * Replace template variables in text
   * Example: {{FRONTEND_DIR}} → "src"
   */
  static replaceVariables(text: string, context: TemplateContext): string {
    return text.replace(this.VARIABLE_PATTERN, (match, varName) => {
      const value = context[varName];
      if (value === undefined) {
        // Keep original placeholder if variable not found
        return match;
      }
      return String(value);
    });
  }

  /**
   * Replace variables in JSON object (deep)
   */
  static replaceVariablesInObject<T>(
    obj: T,
    context: TemplateContext
  ): T {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, context) as any;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceVariablesInObject(item, context)) as any;
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariablesInObject(value, context);
      }
      return result;
    }

    return obj;
  }

  /**
   * Extract template variables from text
   * Returns list of variable names found
   */
  static extractVariables(text: string): string[] {
    const variables = new Set<string>();
    const matches = text.matchAll(this.VARIABLE_PATTERN);

    for (const match of matches) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Extract all variables from JSON object (deep)
   */
  static extractVariablesFromObject(obj: any): string[] {
    const variables = new Set<string>();

    const extract = (value: any): void => {
      if (typeof value === 'string') {
        const vars = this.extractVariables(value);
        vars.forEach((v) => variables.add(v));
      } else if (Array.isArray(value)) {
        value.forEach(extract);
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(extract);
      }
    };

    extract(obj);
    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   */
  static validateContext(
    text: string,
    context: TemplateContext
  ): { valid: boolean; missing: string[] } {
    const required = this.extractVariables(text);
    const missing = required.filter((varName) => context[varName] === undefined);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Render Handlebars template
   * More powerful than simple variable replacement
   */
  static renderHandlebars(template: string, context: TemplateContext): string {
    const compiled = Handlebars.compile(template);
    return compiled(context);
  }

  /**
   * Create default context with common variables
   */
  static createDefaultContext(projectRoot: string): TemplateContext {
    const projectName = projectRoot.split(/[/\\]/).pop() || 'project';

    return {
      PROJECT_ROOT: projectRoot,
      PROJECT_NAME: projectName,
      CLAUDE_DIR: '.claude',
      // Add more defaults as needed
    };
  }

  /**
   * Merge contexts (later context overrides earlier)
   */
  static mergeContexts(...contexts: TemplateContext[]): TemplateContext {
    return Object.assign({}, ...contexts);
  }

  /**
   * Normalize path separators for current OS
   */
  static normalizePath(filePath: string): string {
    return filePath.replace(/[/\\]/g, require('path').sep);
  }

  /**
   * Convert template path to actual path
   * Example: "{{FRONTEND_DIR}}/src" → "frontend/src"
   */
  static resolvePath(templatePath: string, context: TemplateContext): string {
    const resolved = this.replaceVariables(templatePath, context);
    return this.normalizePath(resolved);
  }

  /**
   * Escape regex special characters
   */
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if string contains template variables
   */
  static hasVariables(text: string): boolean {
    return this.VARIABLE_PATTERN.test(text);
  }

  /**
   * Batch replace variables in multiple strings
   */
  static replaceVariablesBatch(
    strings: string[],
    context: TemplateContext
  ): string[] {
    return strings.map((str) => this.replaceVariables(str, context));
  }

  /**
   * Create context from key-value pairs
   */
  static createContext(pairs: Record<string, any>): TemplateContext {
    const context: TemplateContext = {};

    for (const [key, value] of Object.entries(pairs)) {
      // Convert keys to UPPER_CASE if not already
      const normalizedKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      context[normalizedKey] = value;
    }

    return context;
  }
}
