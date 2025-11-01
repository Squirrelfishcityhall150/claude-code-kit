/**
 * Merger - Merge skill-rules fragments and settings
 */

import { SkillRulesFragment, SkillRule } from '../types';
import { TemplateEngine, TemplateContext } from './template-engine';
import { logger } from '../utils/logger';

export class Merger {
  /**
   * Merge multiple skill-rules fragments into one
   * Later fragments override earlier ones for the same skill
   */
  static mergeSkillRulesFragments(
    fragments: SkillRulesFragment[],
    context?: TemplateContext
  ): SkillRulesFragment {
    const merged: SkillRulesFragment = { skills: {} };

    for (const fragment of fragments) {
      // Apply template variable substitution if context provided
      const processedFragment = context
        ? TemplateEngine.replaceVariablesInObject(fragment, context)
        : fragment;

      // Merge skills
      for (const [skillName, skillRule] of Object.entries(
        processedFragment.skills
      )) {
        if (merged.skills[skillName]) {
          // Skill already exists, merge intelligently
          merged.skills[skillName] = this.mergeSkillRules(
            merged.skills[skillName],
            skillRule
          );
          logger.info(`Merged skill rule: ${skillName}`);
        } else {
          // New skill, add it
          merged.skills[skillName] = skillRule;
        }
      }
    }

    return merged;
  }

  /**
   * Merge two skill rules intelligently
   * Combines arrays, later values override earlier for scalars
   */
  private static mergeSkillRules(existing: SkillRule, incoming: SkillRule): SkillRule {
    const merged: SkillRule = {
      type: incoming.type || existing.type,
      enforcement: incoming.enforcement || existing.enforcement,
      priority: incoming.priority || existing.priority,
    };

    // Merge prompt triggers
    if (existing.promptTriggers || incoming.promptTriggers) {
      merged.promptTriggers = {
        keywords: this.mergeArrays(
          existing.promptTriggers?.keywords,
          incoming.promptTriggers?.keywords
        ),
        intentPatterns: this.mergeArrays(
          existing.promptTriggers?.intentPatterns,
          incoming.promptTriggers?.intentPatterns
        ),
      };
    }

    // Merge file triggers
    if (existing.fileTriggers || incoming.fileTriggers) {
      merged.fileTriggers = {
        pathPatterns: this.mergeArrays(
          existing.fileTriggers?.pathPatterns,
          incoming.fileTriggers?.pathPatterns
        ),
        pathExclusions: this.mergeArrays(
          existing.fileTriggers?.pathExclusions,
          incoming.fileTriggers?.pathExclusions
        ),
        contentPatterns: this.mergeArrays(
          existing.fileTriggers?.contentPatterns,
          incoming.fileTriggers?.contentPatterns
        ),
      };
    }

    return merged;
  }

  /**
   * Merge arrays, removing duplicates
   */
  private static mergeArrays<T>(
    arr1: T[] | undefined,
    arr2: T[] | undefined
  ): T[] | undefined {
    if (!arr1 && !arr2) {
      return undefined;
    }

    const combined = [...(arr1 || []), ...(arr2 || [])];
    return Array.from(new Set(combined));
  }

  /**
   * Merge settings.json configurations
   */
  static mergeSettings(
    base: Record<string, any>,
    overrides: Record<string, any>[]
  ): Record<string, any> {
    let merged = { ...base };

    for (const override of overrides) {
      merged = this.deepMerge(merged, override);
    }

    return merged;
  }

  /**
   * Deep merge two objects
   */
  private static deepMerge(target: any, source: any): any {
    if (Array.isArray(target) && Array.isArray(source)) {
      // For arrays, concatenate and remove duplicates
      return Array.from(new Set([...target, ...source]));
    }

    if (this.isPlainObject(target) && this.isPlainObject(source)) {
      const merged = { ...target };

      for (const key of Object.keys(source)) {
        if (this.isPlainObject(source[key])) {
          merged[key] = this.deepMerge(merged[key] || {}, source[key]);
        } else if (Array.isArray(source[key])) {
          merged[key] = this.deepMerge(merged[key] || [], source[key]);
        } else {
          merged[key] = source[key];
        }
      }

      return merged;
    }

    // For primitives, source overrides target
    return source;
  }

  /**
   * Check if value is a plain object (not array, null, etc.)
   */
  private static isPlainObject(value: any): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
    );
  }

  /**
   * Merge hooks configurations from plugins
   */
  static mergeHooks(
    baseHooks: Record<string, any>,
    pluginHooks: Record<string, any>[]
  ): Record<string, any> {
    const merged = { ...baseHooks };

    for (const hooks of pluginHooks) {
      for (const [hookType, hookConfigs] of Object.entries(hooks)) {
        if (!merged[hookType]) {
          merged[hookType] = [];
        }

        // Ensure it's an array
        if (!Array.isArray(merged[hookType])) {
          merged[hookType] = [merged[hookType]];
        }

        // Add new hook configs
        const incoming = Array.isArray(hookConfigs) ? hookConfigs : [hookConfigs];
        merged[hookType].push(...incoming);
      }
    }

    return merged;
  }

  /**
   * Remove duplicates from skill-rules.json
   * Useful after merging multiple fragments
   */
  static deduplicateSkillRules(fragment: SkillRulesFragment): SkillRulesFragment {
    const deduplicated: SkillRulesFragment = { skills: {} };

    for (const [skillName, skillRule] of Object.entries(fragment.skills)) {
      deduplicated.skills[skillName] = {
        ...skillRule,
        promptTriggers: skillRule.promptTriggers
          ? {
              keywords: skillRule.promptTriggers.keywords
                ? Array.from(new Set(skillRule.promptTriggers.keywords))
                : undefined,
              intentPatterns: skillRule.promptTriggers.intentPatterns
                ? Array.from(new Set(skillRule.promptTriggers.intentPatterns))
                : undefined,
            }
          : undefined,
        fileTriggers: skillRule.fileTriggers
          ? {
              pathPatterns: skillRule.fileTriggers.pathPatterns
                ? Array.from(new Set(skillRule.fileTriggers.pathPatterns))
                : undefined,
              pathExclusions: skillRule.fileTriggers.pathExclusions
                ? Array.from(new Set(skillRule.fileTriggers.pathExclusions))
                : undefined,
              contentPatterns: skillRule.fileTriggers.contentPatterns
                ? Array.from(new Set(skillRule.fileTriggers.contentPatterns))
                : undefined,
            }
          : undefined,
      };
    }

    return deduplicated;
  }

  /**
   * Sort skills by priority
   */
  static sortSkillsByPriority(fragment: SkillRulesFragment): SkillRulesFragment {
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const entries = Object.entries(fragment.skills).sort((a, b) => {
      const priorityA = priorityOrder[a[1].priority] ?? 999;
      const priorityB = priorityOrder[b[1].priority] ?? 999;
      return priorityA - priorityB;
    });

    const sorted: SkillRulesFragment = { skills: {} };
    for (const [skillName, skillRule] of entries) {
      sorted.skills[skillName] = skillRule;
    }

    return sorted;
  }

  /**
   * Validate merged result doesn't have conflicts
   */
  static validateMergedSkillRules(fragment: SkillRulesFragment): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for skills with same enforcement level but different types
    const skillsByEnforcement: Record<string, string[]> = {};
    for (const [skillName, skillRule] of Object.entries(fragment.skills)) {
      const key = `${skillRule.enforcement}:${skillRule.type}`;
      if (!skillsByEnforcement[key]) {
        skillsByEnforcement[key] = [];
      }
      skillsByEnforcement[key].push(skillName);
    }

    // Warn about multiple blocking guardrails
    const blockingGuardrails = skillsByEnforcement['block:guardrail'] || [];
    if (blockingGuardrails.length > 1) {
      warnings.push(
        `Multiple blocking guardrails found: ${blockingGuardrails.join(', ')}. This may cause conflicts.`
      );
    }

    // Check for empty trigger patterns
    for (const [skillName, skillRule] of Object.entries(fragment.skills)) {
      const hasPromptTriggers =
        skillRule.promptTriggers?.keywords?.length ||
        skillRule.promptTriggers?.intentPatterns?.length;
      const hasFileTriggers =
        skillRule.fileTriggers?.pathPatterns?.length ||
        skillRule.fileTriggers?.contentPatterns?.length;

      if (!hasPromptTriggers && !hasFileTriggers) {
        warnings.push(
          `Skill "${skillName}" has no trigger patterns. It will never activate.`
        );
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}
