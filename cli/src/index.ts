#!/usr/bin/env node

/**
 * Claude Code CLI - Main entry point
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { pluginCommand } from './commands/plugin';
import { updateCommand } from './commands/update';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('claude-code-cli')
  .description('CLI to initialize and manage Claude Code infrastructure with framework plugins')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize Claude Code infrastructure in your project')
  .option('--frontend <framework>', 'Frontend framework plugin (react-mui, nextjs, vue, svelte)')
  .option('--backend <framework>', 'Backend framework plugin (express, fastify, nextjs-api)')
  .option('--plugins <plugins...>', 'Additional plugins to install')
  .option('--preset <name>', 'Use a preset configuration')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-f, --force', 'Overwrite existing .claude directory')
  .option('--detect-only', 'Only detect project structure, don\'t install')
  .action(initCommand);

// Add command
program
  .command('add')
  .description('Add individual components (skills, agents, commands, hooks)')
  .argument('[component]', 'Component to add (e.g., skill:frontend-dev-guidelines, agent:code-reviewer)')
  .option('--plugin <name>', 'Add from specific plugin')
  .option('--type <type>', 'Component type (skill, agent, command, hook)')
  .action(addCommand);

// Plugin commands
const pluginCmd = program
  .command('plugin')
  .description('Manage plugins');

pluginCmd
  .command('list')
  .description('List available plugins')
  .option('--installed', 'Show only installed plugins')
  .action(pluginCommand.list);

pluginCmd
  .command('install <plugins...>')
  .description('Install one or more plugins')
  .action(pluginCommand.install);

pluginCmd
  .command('uninstall <plugin>')
  .description('Uninstall a plugin')
  .action(pluginCommand.uninstall);

pluginCmd
  .command('create <name>')
  .description('Create a new plugin scaffold')
  .action(pluginCommand.create);

pluginCmd
  .command('validate [path]')
  .description('Validate a plugin manifest')
  .action(pluginCommand.validate);

// Update command
program
  .command('update')
  .description('Update Claude Code configuration')
  .option('--detect', 'Auto-detect and update path patterns')
  .option('--upgrade', 'Upgrade plugins to latest versions')
  .option('--paths', 'Update only path patterns in skill-rules.json')
  .action(updateCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code === 'commander.help') {
    // Help was displayed, exit gracefully
    process.exit(0);
  } else if (error.code === 'commander.version') {
    // Version was displayed, exit gracefully
    process.exit(0);
  } else {
    // Actual error
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
