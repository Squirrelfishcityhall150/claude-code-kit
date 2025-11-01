/**
 * Interactive prompts using inquirer
 */

import inquirer from 'inquirer';
import { DetectedProject } from '../types';

export class Prompts {
  /**
   * Confirm action
   */
  static async confirm(message: string, defaultValue = false): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ]);

    return confirmed;
  }

  /**
   * Select single option
   */
  static async select<T = string>(
    message: string,
    choices: Array<{ name: string; value: T }>,
    defaultValue?: T
  ): Promise<T> {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        default: defaultValue,
      },
    ]);

    return selected;
  }

  /**
   * Select multiple options
   */
  static async selectMultiple<T = string>(
    message: string,
    choices: Array<{ name: string; value: T; checked?: boolean }>,
  ): Promise<T[]> {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message,
        choices,
      },
    ]);

    return selected;
  }

  /**
   * Text input
   */
  static async input(
    message: string,
    defaultValue?: string,
    validate?: (input: string) => boolean | string
  ): Promise<string> {
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: defaultValue,
        validate,
      },
    ]);

    return value;
  }

  /**
   * Prompt for frontend framework
   */
  static async selectFrontendFramework(
    detected?: string | null
  ): Promise<string | null> {
    const choices = [
      {
        name: detected === 'react'
          ? 'react-mui (Detected: React in dependencies)'
          : 'react-mui - React 18+ with Material-UI v7',
        value: 'react-mui',
      },
      {
        name: detected === 'nextjs'
          ? 'nextjs (Detected: Next.js in dependencies)'
          : 'nextjs - Next.js with App Router',
        value: 'nextjs',
      },
      {
        name: 'shadcn - React with shadcn/ui components',
        value: 'shadcn',
      },
      {
        name: 'vue - Vue 3 with Composition API',
        value: 'vue',
      },
      {
        name: 'svelte - Svelte and SvelteKit',
        value: 'svelte',
      },
      {
        name: 'none - Skip frontend plugins',
        value: null,
      },
    ];

    // Put detected option first if available
    if (detected) {
      const detectedIndex = choices.findIndex((c) =>
        c.value?.includes(detected)
      );
      if (detectedIndex > 0) {
        const [detectedChoice] = choices.splice(detectedIndex, 1);
        choices.unshift(detectedChoice);
      }
    }

    return this.select('Select frontend framework:', choices, detected || undefined);
  }

  /**
   * Prompt for backend framework
   */
  static async selectBackendFramework(
    detected?: string | null
  ): Promise<string | null> {
    const choices = [
      {
        name: detected === 'express'
          ? 'express (Detected: Express in dependencies)'
          : 'express - Express.js with TypeScript',
        value: 'express',
      },
      {
        name: detected === 'fastify'
          ? 'fastify (Detected: Fastify in dependencies)'
          : 'fastify - Fastify framework',
        value: 'fastify',
      },
      {
        name: 'nextjs-api - Next.js API routes',
        value: 'nextjs-api',
      },
      {
        name: 'none - Skip backend plugins',
        value: null,
      },
    ];

    // Put detected option first if available
    if (detected) {
      const detectedIndex = choices.findIndex((c) => c.value === detected);
      if (detectedIndex > 0) {
        const [detectedChoice] = choices.splice(detectedIndex, 1);
        choices.unshift(detectedChoice);
      }
    }

    return this.select('Select backend framework:', choices, detected || undefined);
  }

  /**
   * Prompt for additional plugins
   */
  static async selectAdditionalPlugins(
    detected: {
      hasSentry?: boolean;
      hasPrisma?: boolean;
    }
  ): Promise<string[]> {
    const choices = [
      {
        name: detected.hasSentry
          ? 'sentry (Detected in dependencies)'
          : 'sentry - Sentry error tracking',
        value: 'sentry',
        checked: detected.hasSentry,
      },
      {
        name: detected.hasPrisma
          ? 'prisma (Detected in dependencies)'
          : 'prisma - Prisma ORM patterns',
        value: 'prisma',
        checked: detected.hasPrisma,
      },
    ];

    return this.selectMultiple('Additional tools:', choices);
  }

  /**
   * Prompt for directory paths
   */
  static async promptDirectories(defaults: {
    frontendDir?: string;
    backendDir?: string;
  }): Promise<{
    frontendDir: string;
    backendDir: string;
  }> {
    const answers: any = {};

    if (defaults.frontendDir) {
      answers.frontendDir = await this.input(
        'Frontend source directory:',
        defaults.frontendDir
      );
    }

    if (defaults.backendDir) {
      answers.backendDir = await this.input(
        'Backend source directory:',
        defaults.backendDir
      );
    }

    return {
      frontendDir: answers.frontendDir || 'src',
      backendDir: answers.backendDir || 'src',
    };
  }

  /**
   * Full init wizard
   */
  static async initWizard(detected: DetectedProject): Promise<{
    frontend: string | null;
    backend: string | null;
    additionalPlugins: string[];
    directories: {
      frontendDir: string;
      backendDir: string;
    };
  }> {
    // Frontend framework
    const frontend = await this.selectFrontendFramework(
      detected.frontend?.framework
    );

    // Backend framework
    const backend = await this.selectBackendFramework(
      detected.backend?.framework
    );

    // Additional plugins
    const additionalPlugins = await this.selectAdditionalPlugins({
      hasSentry: detected.backend?.hasSentry || detected.frontend?.hasMUI,
      hasPrisma: detected.backend?.hasPrisma,
    });

    // Directory paths
    const directories = await this.promptDirectories({
      frontendDir: detected.frontend?.directory,
      backendDir: detected.backend?.directory,
    });

    return {
      frontend,
      backend,
      additionalPlugins,
      directories,
    };
  }

  /**
   * Confirm overwrite
   */
  static async confirmOverwrite(): Promise<boolean> {
    return this.confirm(
      '.claude directory already exists. Overwrite?',
      false
    );
  }

  /**
   * Confirm continue with warnings
   */
  static async confirmWithWarnings(warnings: string[]): Promise<boolean> {
    console.log('\nWarnings:');
    warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));
    console.log('');

    return this.confirm('Continue anyway?', false);
  }
}
