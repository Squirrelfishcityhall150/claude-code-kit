/**
 * Project Detector - Auto-detect project structure and frameworks
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import {
  DetectedProject,
  FrontendInfo,
  BackendInfo,
  MonorepoInfo,
} from '../types';
import { logger } from '../utils/logger';

export class ProjectDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect complete project structure
   */
  async detect(): Promise<DetectedProject> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    let packageJson: any = null;

    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }

    // Check if monorepo
    const monorepoInfo = await this.detectMonorepo(packageJson);

    // Detect frontend
    const frontendInfo = await this.detectFrontend(packageJson);

    // Detect backend
    const backendInfo = await this.detectBackend(packageJson);

    // Determine project type
    let type: DetectedProject['type'] = 'unknown';
    if (monorepoInfo) {
      type = 'monorepo';
    } else if (frontendInfo && backendInfo) {
      type = 'fullstack';
    } else if (frontendInfo) {
      type = 'frontend';
    } else if (backendInfo) {
      type = 'backend';
    }

    return {
      type,
      frontend: frontendInfo || undefined,
      backend: backendInfo || undefined,
      monorepo: monorepoInfo || undefined,
      rootPath: this.projectRoot,
    };
  }

  /**
   * Detect monorepo configuration
   */
  private async detectMonorepo(
    packageJson: any
  ): Promise<MonorepoInfo | null> {
    // Check for monorepo tools
    const monorepoFiles = [
      'turbo.json',
      'nx.json',
      'lerna.json',
      'pnpm-workspace.yaml',
    ];

    let tool: MonorepoInfo['tool'] = null;

    for (const file of monorepoFiles) {
      if (await fs.pathExists(path.join(this.projectRoot, file))) {
        if (file === 'turbo.json') tool = 'turborepo';
        else if (file === 'nx.json') tool = 'nx';
        else if (file === 'lerna.json') tool = 'lerna';
        else if (file === 'pnpm-workspace.yaml') tool = 'pnpm-workspaces';
        break;
      }
    }

    // Check for workspace configuration
    const hasWorkspaces =
      packageJson?.workspaces ||
      packageJson?.private === true;

    if (!tool && hasWorkspaces) {
      // Detect package manager from lock file
      if (await fs.pathExists(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
        tool = 'pnpm-workspaces';
      } else if (await fs.pathExists(path.join(this.projectRoot, 'yarn.lock'))) {
        tool = 'yarn-workspaces';
      }
    }

    if (!tool) {
      return null;
    }

    // Find packages
    const packages: string[] = [];
    const workspacePatterns = packageJson?.workspaces || ['packages/*', 'apps/*'];
    const patterns = Array.isArray(workspacePatterns)
      ? workspacePatterns
      : workspacePatterns.packages || [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.projectRoot,
        onlyDirectories: true,
      });
      packages.push(...matches);
    }

    const packageManager = await this.detectPackageManager();

    return {
      tool,
      packages,
      packageManager,
    };
  }

  /**
   * Detect frontend framework and configuration
   */
  private async detectFrontend(
    packageJson: any
  ): Promise<FrontendInfo | null> {
    if (!packageJson) {
      return null;
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for frontend frameworks
    let framework: FrontendInfo['framework'] = null;

    if (deps['next']) {
      framework = 'nextjs';
    } else if (deps['react']) {
      framework = 'react';
    } else if (deps['vue']) {
      framework = 'vue';
    } else if (deps['svelte']) {
      framework = 'svelte';
    } else if (deps['@angular/core']) {
      framework = 'angular';
    }

    if (!framework) {
      return null;
    }

    // Detect TypeScript
    const hasTypeScript = !!(
      deps['typescript'] ||
      (await fs.pathExists(path.join(this.projectRoot, 'tsconfig.json')))
    );

    // Detect UI libraries
    const hasMUI = !!(deps['@mui/material'] || deps['@material-ui/core']);
    const hasShadcn = await this.detectShadcn();
    const hasTailwind = !!(deps['tailwindcss'] || deps['tailwind']);

    // Detect frontend directory
    const directory = await this.detectFrontendDirectory(framework);

    const packageManager = await this.detectPackageManager();

    return {
      framework,
      directory,
      hasTypeScript,
      hasMUI,
      hasShadcn,
      hasTailwind,
      packageManager,
    };
  }

  /**
   * Detect backend framework and configuration
   */
  private async detectBackend(
    packageJson: any
  ): Promise<BackendInfo | null> {
    if (!packageJson) {
      return null;
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for backend frameworks
    let framework: BackendInfo['framework'] = null;

    if (deps['express']) {
      framework = 'express';
    } else if (deps['fastify']) {
      framework = 'fastify';
    } else if (deps['@nestjs/core']) {
      framework = 'nest';
    } else if (deps['koa']) {
      framework = 'koa';
    } else if (deps['next'] && await this.hasNextApiRoutes()) {
      framework = 'nextjs-api';
    }

    if (!framework) {
      return null;
    }

    // Detect TypeScript
    const hasTypeScript = !!(
      deps['typescript'] ||
      (await fs.pathExists(path.join(this.projectRoot, 'tsconfig.json')))
    );

    // Detect tools
    const hasPrisma = !!deps['@prisma/client'];
    const hasSentry = !!(deps['@sentry/node'] || deps['@sentry/browser']);
    const hasKeycloak = !!(deps['keycloak-connect'] || deps['keycloak-js']);

    // Detect backend directory
    const directory = await this.detectBackendDirectory();

    const packageManager = await this.detectPackageManager();

    return {
      framework,
      directory,
      hasTypeScript,
      hasPrisma,
      hasSentry,
      hasKeycloak,
      packageManager,
    };
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(): Promise<
    'npm' | 'yarn' | 'pnpm' | 'bun'
  > {
    if (await fs.pathExists(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (await fs.pathExists(path.join(this.projectRoot, 'yarn.lock'))) {
      return 'yarn';
    }
    if (await fs.pathExists(path.join(this.projectRoot, 'bun.lockb'))) {
      return 'bun';
    }
    return 'npm';
  }

  /**
   * Detect if shadcn/ui is used
   */
  private async detectShadcn(): Promise<boolean> {
    // Check for components.json (shadcn/ui config)
    if (await fs.pathExists(path.join(this.projectRoot, 'components.json'))) {
      return true;
    }

    // Check for typical shadcn components directory
    const componentsDir = path.join(this.projectRoot, 'components', 'ui');
    if (await fs.pathExists(componentsDir)) {
      // Check if it has shadcn-style components
      const files = await fs.readdir(componentsDir);
      return files.some((f) =>
        ['button.tsx', 'card.tsx', 'dialog.tsx'].includes(f)
      );
    }

    return false;
  }

  /**
   * Detect if Next.js has API routes
   */
  private async hasNextApiRoutes(): Promise<boolean> {
    const apiDirs = [
      path.join(this.projectRoot, 'pages', 'api'),
      path.join(this.projectRoot, 'src', 'pages', 'api'),
      path.join(this.projectRoot, 'app', 'api'),
      path.join(this.projectRoot, 'src', 'app', 'api'),
    ];

    for (const dir of apiDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        if (files.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect frontend source directory
   */
  private async detectFrontendDirectory(
    framework: string | null
  ): Promise<string> {
    const possibleDirs = [
      'src',
      'client',
      'frontend',
      'web',
      'app',
      'packages/web',
      'apps/web',
    ];

    // For Next.js, check for app or pages directory
    if (framework === 'nextjs') {
      if (await fs.pathExists(path.join(this.projectRoot, 'app'))) {
        return 'app';
      }
      if (await fs.pathExists(path.join(this.projectRoot, 'pages'))) {
        return 'pages';
      }
      if (await fs.pathExists(path.join(this.projectRoot, 'src', 'app'))) {
        return 'src';
      }
    }

    // Check each possible directory
    for (const dir of possibleDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (await fs.pathExists(fullPath)) {
        // Check if it has frontend files
        const hasFrontendFiles = await this.hasFrontendFiles(fullPath);
        if (hasFrontendFiles) {
          return dir;
        }
      }
    }

    // Default to src
    return 'src';
  }

  /**
   * Detect backend source directory
   */
  private async detectBackendDirectory(): Promise<string> {
    const possibleDirs = [
      'src',
      'server',
      'backend',
      'api',
      'services',
      'packages/api',
      'apps/api',
    ];

    for (const dir of possibleDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (await fs.pathExists(fullPath)) {
        // Check if it has backend files
        const hasBackendFiles = await this.hasBackendFiles(fullPath);
        if (hasBackendFiles) {
          return dir;
        }
      }
    }

    // Default to src
    return 'src';
  }

  /**
   * Check if directory contains frontend files
   */
  private async hasFrontendFiles(dir: string): Promise<boolean> {
    const frontendExtensions = ['.tsx', '.jsx', '.vue', '.svelte'];
    const files = await glob('**/*', {
      cwd: dir,
      nodir: true,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    return files.some((file) =>
      frontendExtensions.some((ext) => file.endsWith(ext))
    );
  }

  /**
   * Check if directory contains backend files
   */
  private async hasBackendFiles(dir: string): Promise<boolean> {
    const backendPatterns = [
      '**/routes/**/*.ts',
      '**/routes/**/*.js',
      '**/controllers/**/*.ts',
      '**/controllers/**/*.js',
      '**/api/**/*.ts',
      '**/api/**/*.js',
      'app.ts',
      'app.js',
      'server.ts',
      'server.js',
      'index.ts',
      'index.js',
    ];

    for (const pattern of backendPatterns) {
      const matches = await glob(pattern, {
        cwd: dir,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
      });

      if (matches.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get recommended plugins based on detection
   */
  getRecommendedPlugins(project: DetectedProject): string[] {
    const plugins: string[] = [];

    // Frontend plugins
    if (project.frontend) {
      if (project.frontend.framework === 'react' && project.frontend.hasMUI) {
        plugins.push('react-mui');
      } else if (project.frontend.framework === 'nextjs') {
        plugins.push('nextjs');
      } else if (project.frontend.framework === 'react' && project.frontend.hasShadcn) {
        plugins.push('shadcn');
      } else if (project.frontend.framework === 'vue') {
        plugins.push('vue');
      } else if (project.frontend.framework === 'svelte') {
        plugins.push('svelte');
      }
    }

    // Backend plugins
    if (project.backend) {
      if (project.backend.framework === 'express') {
        plugins.push('express');
      } else if (project.backend.framework === 'fastify') {
        plugins.push('fastify');
      } else if (project.backend.framework === 'nextjs-api') {
        // Already covered by nextjs plugin
        if (!plugins.includes('nextjs')) {
          plugins.push('nextjs');
        }
      }
    }

    // Tool plugins
    if (project.backend?.hasSentry || project.frontend?.hasMUI) {
      plugins.push('sentry');
    }

    if (project.backend?.hasPrisma) {
      plugins.push('prisma');
    }

    return plugins;
  }

  /**
   * Create template context from detected project
   */
  createTemplateContext(project: DetectedProject): Record<string, string> {
    const context: Record<string, string> = {
      PROJECT_ROOT: this.projectRoot,
      PROJECT_NAME: path.basename(this.projectRoot),
    };

    if (project.frontend) {
      context.FRONTEND_DIR = project.frontend.directory;
      context.COMPONENTS_DIR = path.join(
        project.frontend.directory,
        'components'
      );
      context.FEATURES_DIR = path.join(project.frontend.directory, 'features');
    }

    if (project.backend) {
      context.BACKEND_DIR = project.backend.directory;
      context.API_DIR = path.join(project.backend.directory, 'api');
      context.SERVICES_DIR = path.join(project.backend.directory, 'services');
    }

    return context;
  }

  /**
   * Log detection results
   */
  logDetectionResults(project: DetectedProject): void {
    logger.section('Detected Project Structure');

    logger.info(`Type: ${project.type}`);

    if (project.frontend) {
      logger.log('');
      logger.keyValue('Frontend Framework', project.frontend.framework || 'none');
      logger.keyValue('Frontend Directory', project.frontend.directory);
      logger.keyValue('TypeScript', project.frontend.hasTypeScript ? 'Yes' : 'No');
      if (project.frontend.hasMUI) logger.keyValue('Material-UI', 'Yes');
      if (project.frontend.hasShadcn) logger.keyValue('shadcn/ui', 'Yes');
      if (project.frontend.hasTailwind) logger.keyValue('Tailwind CSS', 'Yes');
    }

    if (project.backend) {
      logger.log('');
      logger.keyValue('Backend Framework', project.backend.framework || 'none');
      logger.keyValue('Backend Directory', project.backend.directory);
      logger.keyValue('TypeScript', project.backend.hasTypeScript ? 'Yes' : 'No');
      if (project.backend.hasPrisma) logger.keyValue('Prisma', 'Yes');
      if (project.backend.hasSentry) logger.keyValue('Sentry', 'Yes');
      if (project.backend.hasKeycloak) logger.keyValue('Keycloak', 'Yes');
    }

    if (project.monorepo) {
      logger.log('');
      logger.keyValue('Monorepo Tool', project.monorepo.tool || 'workspaces');
      logger.keyValue('Packages', project.monorepo.packages.length.toString());
      if (project.monorepo.packages.length > 0) {
        logger.list(project.monorepo.packages.slice(0, 5));
        if (project.monorepo.packages.length > 5) {
          logger.info(`  ... and ${project.monorepo.packages.length - 5} more`);
        }
      }
    }

    logger.log('');
  }
}
