/**
 * Plugin validation using Ajv
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import {
  pluginManifestSchema,
  skillRulesFragmentSchema,
  cliConfigSchema,
} from './schemas';
import { PluginManifest, SkillRulesFragment, CLIConfig } from '../types';
import { Validators } from '../utils/validators';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile schemas
const validatePluginManifest = ajv.compile(pluginManifestSchema);
const validateSkillRulesFragment = ajv.compile(skillRulesFragmentSchema);
const validateCLIConfig = ajv.compile(cliConfigSchema);

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export class PluginValidator {
  /**
   * Validate plugin manifest
   */
  static validateManifest(manifest: unknown): ValidationResult {
    const valid = validatePluginManifest(manifest);

    if (!valid && validatePluginManifest.errors) {
      return {
        valid: false,
        errors: this.formatErrors(validatePluginManifest.errors),
      };
    }

    // Additional validations
    const typedManifest = manifest as PluginManifest;
    const additionalErrors: string[] = [];

    // Validate semver ranges
    if (!Validators.isValidVersionRange(typedManifest.compatibility.claudeCode)) {
      additionalErrors.push(
        `Invalid claudeCode version range: ${typedManifest.compatibility.claudeCode}`
      );
    }

    if (!Validators.isValidVersionRange(typedManifest.compatibility.node)) {
      additionalErrors.push(
        `Invalid node version range: ${typedManifest.compatibility.node}`
      );
    }

    // Validate author format
    if (
      !typedManifest.author.includes('<') &&
      !typedManifest.author.includes('@')
    ) {
      additionalErrors.push(
        'Author should include email (e.g., "Name <email@example.com>")'
      );
    }

    if (additionalErrors.length > 0) {
      return {
        valid: false,
        errors: additionalErrors,
      };
    }

    return { valid: true };
  }

  /**
   * Validate skill rules fragment
   */
  static validateSkillRulesFragment(fragment: unknown): ValidationResult {
    const valid = validateSkillRulesFragment(fragment);

    if (!valid && validateSkillRulesFragment.errors) {
      return {
        valid: false,
        errors: this.formatErrors(validateSkillRulesFragment.errors),
      };
    }

    // Additional validations
    const typedFragment = fragment as SkillRulesFragment;
    const additionalErrors: string[] = [];

    // Validate regex patterns
    for (const [skillName, skill] of Object.entries(typedFragment.skills)) {
      if (skill.promptTriggers?.intentPatterns) {
        for (const pattern of skill.promptTriggers.intentPatterns) {
          try {
            new RegExp(pattern);
          } catch (e) {
            additionalErrors.push(
              `Invalid regex pattern in ${skillName}.promptTriggers.intentPatterns: ${pattern}`
            );
          }
        }
      }

      if (skill.fileTriggers?.contentPatterns) {
        for (const pattern of skill.fileTriggers.contentPatterns) {
          try {
            new RegExp(pattern);
          } catch (e) {
            additionalErrors.push(
              `Invalid regex pattern in ${skillName}.fileTriggers.contentPatterns: ${pattern}`
            );
          }
        }
      }
    }

    if (additionalErrors.length > 0) {
      return {
        valid: false,
        errors: additionalErrors,
      };
    }

    return { valid: true };
  }

  /**
   * Validate CLI config
   */
  static validateCLIConfig(config: unknown): ValidationResult {
    const valid = validateCLIConfig(config);

    if (!valid && validateCLIConfig.errors) {
      return {
        valid: false,
        errors: this.formatErrors(validateCLIConfig.errors),
      };
    }

    return { valid: true };
  }

  /**
   * Format Ajv errors into readable messages
   */
  private static formatErrors(errors: ErrorObject[]): string[] {
    return errors.map((error) => {
      const path = error.instancePath || 'root';
      const message = error.message || 'validation error';

      if (error.keyword === 'additionalProperties') {
        const additionalProp = (error.params as any).additionalProperty;
        return `${path}: unexpected property "${additionalProp}"`;
      }

      if (error.keyword === 'required') {
        const missingProp = (error.params as any).missingProperty;
        return `${path}: missing required property "${missingProp}"`;
      }

      if (error.keyword === 'pattern') {
        const pattern = (error.params as any).pattern;
        return `${path}: ${message} (expected pattern: ${pattern})`;
      }

      if (error.keyword === 'enum') {
        const allowedValues = (error.params as any).allowedValues;
        return `${path}: ${message} (allowed: ${allowedValues.join(', ')})`;
      }

      return `${path}: ${message}`;
    });
  }
}
