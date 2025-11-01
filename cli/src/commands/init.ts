/**
 * Init command - Initialize Claude Code infrastructure
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { InitOptions, CLIConfig } from '../types';
import { logger } from '../utils/logger';
import { Prompts } from '../utils/prompts';
import { ProjectDetector } from '../core/detector';
import { PluginManager } from '../core/plugin-manager';
import { TemplateEngine } from '../core/template-engine';
import { Merger } from '../core/merger';
import { Installer } from '../core/installer';

export async function initCommand(options: InitOptions): Promise<void> {
  logger.header('Claude Code CLI - Initialize Infrastructure');

  try {
    const projectRoot = process.cwd();
    const cliRoot = path.join(__dirname, '../..');

    // Step 1: Check if .claude already exists
    const claudeDir = path.join(projectRoot, '.claude');
    if (await fs.pathExists(claudeDir)) {
      if (!options.force && !options.yes) {
        const shouldOverwrite = await Prompts.confirmOverwrite();
        if (!shouldOverwrite) {
          logger.info('Initialization cancelled');
          return;
        }
      } else if (!options.force) {
        logger.error('.claude directory already exists. Use --force to overwrite.');
        process.exit(1);
      }
    }

    // Step 2: Detect project structure
    logger.startSpinner('Detecting project structure...');
    const detector = new ProjectDetector(projectRoot);
    const detected = await detector.detect();
    logger.succeedSpinner('Project structure detected');

    if (options.detectOnly) {
      detector.logDetectionResults(detected);
      return;
    }

    logger.newLine();
    detector.logDetectionResults(detected);
    logger.newLine();

    // Step 3: Select plugins (interactive or from options)
    let selectedPlugins: string[] = [];
    let frontendDir = detected.frontend?.directory || 'src';
    let backendDir = detected.backend?.directory || 'src';

    if (options.yes) {
      // Use detected plugins
      selectedPlugins = detector.getRecommendedPlugins(detected);
      logger.info('Using detected plugins:');
      logger.list(selectedPlugins);
    } else if (options.frontend || options.backend || options.plugins) {
      // Use command-line options
      if (options.frontend) selectedPlugins.push(options.frontend);
      if (options.backend) selectedPlugins.push(options.backend);
      if (options.plugins) selectedPlugins.push(...options.plugins);
    } else {
      // Interactive wizard
      const answers = await Prompts.initWizard(detected);
      if (answers.frontend) selectedPlugins.push(answers.frontend);
      if (answers.backend) selectedPlugins.push(answers.backend);
      selectedPlugins.push(...answers.additionalPlugins);
      frontendDir = answers.directories.frontendDir;
      backendDir = answers.directories.backendDir;
    }

    logger.newLine();
    logger.section('Installing Infrastructure');

    // Step 4: Initialize plugin manager
    const pluginManager = new PluginManager(cliRoot);

    // Step 5: Resolve plugin dependencies and installation order
    logger.startSpinner('Resolving plugin dependencies...');
    const installOrder = await pluginManager.getInstallationOrder(selectedPlugins);
    logger.succeedSpinner('Dependencies resolved');

    // Step 6: Create template context
    const context = TemplateEngine.mergeContexts(
      TemplateEngine.createDefaultContext(projectRoot),
      TemplateEngine.createContext({
        FRONTEND_DIR: frontendDir,
        BACKEND_DIR: backendDir,
        COMPONENTS_DIR: path.join(frontendDir, 'components'),
        FEATURES_DIR: path.join(frontendDir, 'features'),
        API_DIR: path.join(backendDir, 'api'),
        SERVICES_DIR: path.join(backendDir, 'services'),
      })
    );

    // Step 7: Initialize installer
    const installer = new Installer(projectRoot, cliRoot);

    // Step 8: Create .claude directory
    logger.startSpinner('Creating .claude directory...');
    await installer.createClaudeDirectory({ force: options.force });
    logger.succeedSpinner('Created .claude directory');

    // Step 9: Install core infrastructure
    logger.startSpinner('Installing core infrastructure...');
    await installer.installCore(context);
    logger.succeedSpinner('Installed core infrastructure (hooks, skill-developer)');

    // Step 10: Install plugins
    const installedPlugins: any[] = [];
    for (const pluginName of installOrder) {
      logger.startSpinner(`Installing ${pluginName} plugin...`);

      const plugin = await pluginManager.getPlugin(pluginName);
      if (!plugin) {
        logger.failSpinner(`Plugin not found: ${pluginName}`);
        continue;
      }

      await installer.installPlugin(pluginName, context);

      installedPlugins.push({
        name: pluginName,
        version: plugin.version,
        installedAt: new Date().toISOString(),
      });

      logger.succeedSpinner(`Installed ${pluginName} plugin`);
    }

    // Step 11: Merge skill-rules fragments
    logger.startSpinner('Merging skill-rules.json...');
    const fragments = [];

    // Base fragment (empty for now, could have defaults)
    fragments.push({ skills: {} });

    // Load fragments from each plugin
    for (const pluginName of installOrder) {
      const fragment = await pluginManager.loadSkillRulesFragment(pluginName);
      if (fragment) {
        fragments.push(fragment);
      }
    }

    const mergedSkillRules = Merger.mergeSkillRulesFragments(fragments, context);
    const deduplicatedSkillRules = Merger.deduplicateSkillRules(mergedSkillRules);
    const sortedSkillRules = Merger.sortSkillsByPriority(deduplicatedSkillRules);

    // Validate merged skill rules
    const validation = Merger.validateMergedSkillRules(sortedSkillRules);
    if (validation.warnings.length > 0) {
      logger.updateSpinner('Skill rules merged with warnings');
      logger.succeedSpinner();
      validation.warnings.forEach((warning) => logger.warning(warning));
    } else {
      logger.succeedSpinner(`Merged skill-rules.json (${Object.keys(sortedSkillRules.skills).length} skills)`);
    }

    await installer.createSkillRules(sortedSkillRules);

    // Step 12: Create settings.json
    logger.startSpinner('Creating settings.json...');
    const hooksConfig = {
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: '$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Edit|MultiEdit|Write',
          hooks: [
            {
              type: 'command',
              command: '$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh',
            },
          ],
        },
      ],
    };

    await installer.createSettings(hooksConfig);
    logger.succeedSpinner('Created settings.json');

    // Step 13: Create CLI config
    logger.startSpinner('Creating CLI config...');
    const cliConfig: CLIConfig = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      plugins: installedPlugins,
      customPaths: {
        FRONTEND_DIR: frontendDir,
        BACKEND_DIR: backendDir,
      },
    };

    await installer.createCLIConfig(cliConfig);
    logger.succeedSpinner('Created .claude-code-cli.json');

    // Step 14: Install hook dependencies
    logger.startSpinner('Installing hook dependencies...');
    try {
      await installer.installHookDependencies();
    } catch (error: any) {
      logger.failSpinner('Failed to install hook dependencies');
      logger.warning('You can manually run: cd .claude/hooks && npm install');
    }

    // Step 15: Update .gitignore
    logger.startSpinner('Updating .gitignore...');
    await installer.updateGitignore({ verbose: false });
    logger.succeedSpinner('Updated .gitignore');

    // Step 16: Verify installation
    logger.newLine();
    logger.startSpinner('Verifying installation...');
    const verification = await installer.verifyInstallation();

    if (!verification.valid) {
      logger.failSpinner('Installation verification failed');
      verification.errors.forEach((error) => logger.error(error));
      process.exit(1);
    }

    if (verification.warnings.length > 0) {
      logger.succeedSpinner('Installation verified with warnings');
      verification.warnings.forEach((warning) => logger.warning(warning));
    } else {
      logger.succeedSpinner('Installation verified successfully');
    }

    // Step 17: Success message
    logger.newLine();
    logger.box('Setup Complete! 🎉', [
      'Next steps:',
      '',
      '1. Review configuration:',
      '   .claude/settings.json',
      '   .claude/skills/skill-rules.json',
      '',
      '2. Test skill activation:',
      '   - Edit a file in your project',
      '   - Ask Claude "How do I create a new component?"',
      '   - Skills should auto-activate based on context!',
      '',
      '3. Optional: Add more components',
      '   claude-code-cli add agent code-architecture-reviewer',
      '   claude-code-cli add command dev-docs',
      '',
      'Documentation: https://github.com/...',
    ]);

    logger.newLine();
    logger.section('Installed Plugins');
    installedPlugins.forEach((plugin) => {
      logger.success(`${plugin.name} (v${plugin.version})`);
    });

    logger.newLine();
    logger.section('Installed Skills');
    Object.keys(sortedSkillRules.skills).forEach((skillName) => {
      const skill = sortedSkillRules.skills[skillName];
      logger.success(`${skillName} (${skill.priority}, ${skill.enforcement})`);
    });

    logger.newLine();
  } catch (error: any) {
    logger.error(`Failed to initialize: ${error.message}`);
    if (error.stack) {
      logger.log(error.stack);
    }
    process.exit(1);
  }
}
