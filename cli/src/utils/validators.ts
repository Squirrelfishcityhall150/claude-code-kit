/**
 * Validation utilities
 */

import * as path from 'path';
import * as semver from 'semver';

export class Validators {
  /**
   * Validate plugin name
   * Must be lowercase, alphanumeric with hyphens
   */
  static isValidPluginName(name: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
  }

  /**
   * Validate semver version
   */
  static isValidVersion(version: string): boolean {
    return semver.valid(version) !== null;
  }

  /**
   * Validate semver range
   */
  static isValidVersionRange(range: string): boolean {
    return semver.validRange(range) !== null;
  }

  /**
   * Validate directory path
   */
  static isValidPath(filePath: string): boolean {
    try {
      path.parse(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate skill name
   * Must match naming conventions
   */
  static isValidSkillName(name: string): boolean {
    // Can contain letters, numbers, hyphens
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
  }

  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate GitHub repo URL
   */
  static isValidGitHubUrl(url: string): boolean {
    return /^https?:\/\/github\.com\/[\w-]+\/[\w-]+/.test(url);
  }

  /**
   * Check if version satisfies range
   */
  static satisfiesVersion(version: string, range: string): boolean {
    return semver.satisfies(version, range);
  }

  /**
   * Validate enforcement level
   */
  static isValidEnforcement(
    enforcement: string
  ): enforcement is 'suggest' | 'block' | 'warn' {
    return ['suggest', 'block', 'warn'].includes(enforcement);
  }

  /**
   * Validate skill type
   */
  static isValidSkillType(type: string): type is 'domain' | 'guardrail' {
    return ['domain', 'guardrail'].includes(type);
  }

  /**
   * Validate priority level
   */
  static isValidPriority(
    priority: string
  ): priority is 'critical' | 'high' | 'medium' | 'low' {
    return ['critical', 'high', 'medium', 'low'].includes(priority);
  }
}
