/**
 * Installer - Copy files, create directories, handle permissions
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import { logger } from '../utils/logger';
import { TemplateEngine, TemplateContext } from './template-engine';

export interface InstallOptions {
  force?: boolean; // Overwrite existing files
  dryRun?: boolean; // Don't actually write files
  verbose?: boolean; // Log detailed information
}

export class Installer {
  private projectRoot: string;
  private cliRoot: string;

  constructor(projectRoot: string, cliRoot: string) {
    this.projectRoot = projectRoot;
    this.cliRoot = cliRoot;
  }

  /**
   * Create .claude directory structure
   */
  async createClaudeDirectory(options: InstallOptions = {}): Promise<void> {
    const claudeDir = path.join(this.projectRoot, '.claude');

    // Check if .claude already exists
    if (await fs.pathExists(claudeDir)) {
      if (!options.force) {
        throw new Error(
          '.claude directory already exists. Use --force to overwrite.'
        );
      }
      logger.warning('.claude directory exists, overwriting...');
    }

    if (!options.dryRun) {
      // Create directory structure
      await fs.ensureDir(path.join(claudeDir, 'skills'));
      await fs.ensureDir(path.join(claudeDir, 'hooks'));
      await fs.ensureDir(path.join(claudeDir, 'agents'));
      await fs.ensureDir(path.join(claudeDir, 'commands'));
    }

    if (options.verbose) {
      logger.success('Created .claude directory structure');
    }
  }

  /**
   * Copy core infrastructure (hooks, skill-developer)
   */
  async installCore(
    context: TemplateContext,
    options: InstallOptions = {}
  ): Promise<void> {
    const claudeDir = path.join(this.projectRoot, '.claude');
    const coreDir = path.join(this.cliRoot, 'core');

    // Copy essential hooks
    await this.copyDirectory(
      path.join(coreDir, 'hooks'),
      path.join(claudeDir, 'hooks'),
      context,
      options
    );

    // Make hook scripts executable
    if (!options.dryRun) {
      const hookScripts = await glob('*.sh', {
        cwd: path.join(claudeDir, 'hooks'),
        absolute: true,
      });

      for (const script of hookScripts) {
        await fs.chmod(script, 0o755);
      }
    }

    // Copy skill-developer skill
    await this.copyDirectory(
      path.join(coreDir, 'skills', 'skill-developer'),
      path.join(claudeDir, 'skills', 'skill-developer'),
      context,
      options
    );

    if (options.verbose) {
      logger.success('Installed core infrastructure');
    }
  }

  /**
   * Install plugin to project
   */
  async installPlugin(
    pluginName: string,
    context: TemplateContext,
    options: InstallOptions = {}
  ): Promise<void> {
    const claudeDir = path.join(this.projectRoot, '.claude');
    const pluginDir = path.join(this.cliRoot, 'plugins', pluginName);

    if (!(await fs.pathExists(pluginDir))) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    // Copy skills
    const skillsDir = path.join(pluginDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const skillDirs = await fs.readdir(skillsDir);
      for (const skillName of skillDirs) {
        const skillPath = path.join(skillsDir, skillName);
        const stat = await fs.stat(skillPath);

        if (stat.isDirectory() && skillName !== 'skill-rules.fragment.json') {
          await this.copyDirectory(
            skillPath,
            path.join(claudeDir, 'skills', skillName),
            context,
            options
          );

          if (options.verbose) {
            logger.success(`Installed skill: ${skillName}`);
          }
        }
      }
    }

    // Copy agents
    const agentsDir = path.join(pluginDir, 'agents');
    if (await fs.pathExists(agentsDir)) {
      await this.copyDirectory(
        agentsDir,
        path.join(claudeDir, 'agents'),
        context,
        options
      );

      if (options.verbose) {
        logger.success('Installed agents from plugin');
      }
    }

    // Copy commands
    const commandsDir = path.join(pluginDir, 'commands');
    if (await fs.pathExists(commandsDir)) {
      await this.copyDirectory(
        commandsDir,
        path.join(claudeDir, 'commands'),
        context,
        options
      );

      if (options.verbose) {
        logger.success('Installed commands from plugin');
      }
    }
  }

  /**
   * Copy directory with template substitution
   */
  private async copyDirectory(
    src: string,
    dest: string,
    context: TemplateContext,
    options: InstallOptions = {}
  ): Promise<void> {
    if (!(await fs.pathExists(src))) {
      logger.warning(`Source directory not found: ${src}`);
      return;
    }

    const files = await glob('**/*', {
      cwd: src,
      nodir: true,
      dot: true,
    });

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);

      await this.copyFile(srcPath, destPath, context, options);
    }
  }

  /**
   * Copy file with template substitution
   */
  private async copyFile(
    src: string,
    dest: string,
    context: TemplateContext,
    options: InstallOptions = {}
  ): Promise<void> {
    // Check if destination exists
    if ((await fs.pathExists(dest)) && !options.force) {
      if (options.verbose) {
        logger.warning(`Skipping existing file: ${dest}`);
      }
      return;
    }

    if (options.dryRun) {
      logger.info(`[DRY RUN] Would copy: ${src} → ${dest}`);
      return;
    }

    // Ensure destination directory exists
    await fs.ensureDir(path.dirname(dest));

    // Read file
    const content = await fs.readFile(src, 'utf-8');

    // Apply template substitution for text files
    const ext = path.extname(src);
    const textExtensions = [
      '.md',
      '.ts',
      '.js',
      '.json',
      '.sh',
      '.bash',
      '.txt',
      '.yml',
      '.yaml',
    ];

    let finalContent = content;
    if (textExtensions.includes(ext)) {
      finalContent = TemplateEngine.replaceVariables(content, context);
    }

    // Write file
    await fs.writeFile(dest, finalContent, 'utf-8');

    if (options.verbose) {
      logger.success(`Copied: ${path.relative(this.projectRoot, dest)}`);
    }
  }

  /**
   * Create settings.json
   */
  async createSettings(
    hooksConfig: Record<string, any>,
    options: InstallOptions = {}
  ): Promise<void> {
    const settingsPath = path.join(this.projectRoot, '.claude', 'settings.json');

    const settings = {
      hooks: hooksConfig,
      permissions: {
        editPermissions: 'auto-accept',
        writePermissions: 'auto-accept',
      },
      enabledMcpjsonServers: [],
    };

    if (!options.dryRun) {
      await fs.writeJson(settingsPath, settings, { spaces: 2 });
    }

    if (options.verbose) {
      logger.success('Created settings.json');
    }
  }

  /**
   * Create skill-rules.json
   */
  async createSkillRules(
    skillRules: Record<string, any>,
    options: InstallOptions = {}
  ): Promise<void> {
    const skillRulesPath = path.join(
      this.projectRoot,
      '.claude',
      'skills',
      'skill-rules.json'
    );

    if (!options.dryRun) {
      await fs.writeJson(skillRulesPath, skillRules, { spaces: 2 });
    }

    if (options.verbose) {
      logger.success('Created skill-rules.json');
    }
  }

  /**
   * Create .claude-code-cli.json config
   */
  async createCLIConfig(
    config: Record<string, any>,
    options: InstallOptions = {}
  ): Promise<void> {
    const configPath = path.join(this.projectRoot, '.claude-code-cli.json');

    if (!options.dryRun) {
      await fs.writeJson(configPath, config, { spaces: 2 });
    }

    if (options.verbose) {
      logger.success('Created .claude-code-cli.json');
    }
  }

  /**
   * Install hook dependencies (npm install in .claude/hooks)
   */
  async installHookDependencies(options: InstallOptions = {}): Promise<void> {
    const hooksDir = path.join(this.projectRoot, '.claude', 'hooks');
    const packageJsonPath = path.join(hooksDir, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      if (options.verbose) {
        logger.warning('No package.json found in hooks directory');
      }
      return;
    }

    if (options.dryRun) {
      logger.info('[DRY RUN] Would run: npm install in .claude/hooks');
      return;
    }

    logger.startSpinner('Installing hook dependencies...');

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      await execAsync('npm install', { cwd: hooksDir });

      logger.succeedSpinner('Hook dependencies installed');
    } catch (error: any) {
      logger.failSpinner('Failed to install hook dependencies');
      throw error;
    }
  }

  /**
   * Create .gitignore entries for .claude directory
   */
  async updateGitignore(options: InstallOptions = {}): Promise<void> {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');

    const entries = [
      '# Claude Code',
      '.claude/settings.local.json',
      '.claude/hooks/node_modules/',
      '.claude-code-cli.json',
    ];

    let content = '';
    if (await fs.pathExists(gitignorePath)) {
      content = await fs.readFile(gitignorePath, 'utf-8');
    }

    // Check if entries already exist
    const hasClaudeEntries = content.includes('# Claude Code');
    if (hasClaudeEntries) {
      if (options.verbose) {
        logger.info('.gitignore already has Claude Code entries');
      }
      return;
    }

    // Append entries
    const newContent = content + '\n\n' + entries.join('\n') + '\n';

    if (!options.dryRun) {
      await fs.writeFile(gitignorePath, newContent, 'utf-8');
    }

    if (options.verbose) {
      logger.success('Updated .gitignore');
    }
  }

  /**
   * Verify installation
   */
  async verifyInstallation(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const claudeDir = path.join(this.projectRoot, '.claude');

    // Check .claude directory exists
    if (!(await fs.pathExists(claudeDir))) {
      errors.push('.claude directory not found');
      return { valid: false, errors, warnings };
    }

    // Check essential files
    const essentialFiles = [
      'settings.json',
      'skills/skill-rules.json',
      'hooks/skill-activation-prompt.sh',
      'hooks/skill-activation-prompt.ts',
      'hooks/post-tool-use-tracker.sh',
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(claudeDir, file);
      if (!(await fs.pathExists(filePath))) {
        errors.push(`Missing essential file: ${file}`);
      }
    }

    // Check hook permissions
    const hookScripts = await glob('hooks/*.sh', {
      cwd: claudeDir,
      absolute: true,
    });

    for (const script of hookScripts) {
      const stats = await fs.stat(script);
      const isExecutable = (stats.mode & 0o111) !== 0;

      if (!isExecutable) {
        warnings.push(`Hook script not executable: ${path.basename(script)}`);
      }
    }

    // Check hook dependencies
    const hookNodeModules = path.join(claudeDir, 'hooks', 'node_modules');
    if (!(await fs.pathExists(hookNodeModules))) {
      warnings.push('Hook dependencies not installed (run npm install in .claude/hooks)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
