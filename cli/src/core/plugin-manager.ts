/**
 * Plugin Manager - Load, validate, and manage plugins
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import { PluginManifest, InstalledPlugin, SkillRulesFragment } from '../types';
import { PluginValidator } from './plugin-validator';
import { logger } from '../utils/logger';

export class PluginManager {
  private pluginsDir: string;
  private cacheDir: string;

  constructor(cliRoot: string) {
    this.pluginsDir = path.join(cliRoot, 'plugins');
    this.cacheDir = path.join(cliRoot, '.cache');
  }

  /**
   * Get all available plugins
   */
  async getAvailablePlugins(): Promise<PluginManifest[]> {
    const plugins: PluginManifest[] = [];

    try {
      // Find all plugin.json files
      const manifestPaths = await glob('*/plugin.json', {
        cwd: this.pluginsDir,
        absolute: true,
      });

      for (const manifestPath of manifestPaths) {
        try {
          const manifest = await this.loadManifest(manifestPath);
          plugins.push(manifest);
        } catch (error: any) {
          logger.warning(`Failed to load plugin at ${manifestPath}: ${error.message}`);
        }
      }

      return plugins;
    } catch (error: any) {
      logger.error(`Failed to get available plugins: ${error.message}`);
      return [];
    }
  }

  /**
   * Load and validate a plugin manifest
   */
  async loadManifest(manifestPath: string): Promise<PluginManifest> {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    // Validate manifest
    const validation = PluginValidator.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Invalid plugin manifest:\n${validation.errors?.join('\n')}`
      );
    }

    return manifest as PluginManifest;
  }

  /**
   * Get plugin by name
   */
  async getPlugin(name: string): Promise<PluginManifest | null> {
    const manifestPath = path.join(this.pluginsDir, name, 'plugin.json');

    if (!(await fs.pathExists(manifestPath))) {
      return null;
    }

    return this.loadManifest(manifestPath);
  }

  /**
   * Get plugin directory path
   */
  getPluginDir(pluginName: string): string {
    return path.join(this.pluginsDir, pluginName);
  }

  /**
   * Load skill rules fragment from plugin
   */
  async loadSkillRulesFragment(
    pluginName: string
  ): Promise<SkillRulesFragment | null> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin || !plugin.provides.skillRulesFragment) {
      return null;
    }

    const fragmentPath = path.join(
      this.getPluginDir(pluginName),
      plugin.provides.skillRulesFragment
    );

    if (!(await fs.pathExists(fragmentPath))) {
      logger.warning(
        `Skill rules fragment not found: ${plugin.provides.skillRulesFragment}`
      );
      return null;
    }

    const content = await fs.readFile(fragmentPath, 'utf-8');
    const fragment = JSON.parse(content);

    // Validate fragment
    const validation = PluginValidator.validateSkillRulesFragment(fragment);
    if (!validation.valid) {
      throw new Error(
        `Invalid skill rules fragment:\n${validation.errors?.join('\n')}`
      );
    }

    return fragment as SkillRulesFragment;
  }

  /**
   * Get skills from plugin
   */
  async getPluginSkills(pluginName: string): Promise<string[]> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin || !plugin.provides.skills) {
      return [];
    }

    const pluginDir = this.getPluginDir(pluginName);
    const skillsDir = path.join(pluginDir, 'skills');

    if (!(await fs.pathExists(skillsDir))) {
      return [];
    }

    const skills: string[] = [];
    for (const skillName of plugin.provides.skills) {
      const skillPath = path.join(skillsDir, skillName);
      if (await fs.pathExists(skillPath)) {
        skills.push(skillName);
      }
    }

    return skills;
  }

  /**
   * Get agents from plugin
   */
  async getPluginAgents(pluginName: string): Promise<string[]> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin || !plugin.provides.agents) {
      return [];
    }

    const pluginDir = this.getPluginDir(pluginName);
    const agentsDir = path.join(pluginDir, 'agents');

    if (!(await fs.pathExists(agentsDir))) {
      return [];
    }

    const agents: string[] = [];
    for (const agentName of plugin.provides.agents) {
      const agentPath = path.join(agentsDir, agentName);
      if (await fs.pathExists(agentPath)) {
        agents.push(agentName);
      }
    }

    return agents;
  }

  /**
   * Get commands from plugin
   */
  async getPluginCommands(pluginName: string): Promise<string[]> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin || !plugin.provides.commands) {
      return [];
    }

    const pluginDir = this.getPluginDir(pluginName);
    const commandsDir = path.join(pluginDir, 'commands');

    if (!(await fs.pathExists(commandsDir))) {
      return [];
    }

    const commands: string[] = [];
    for (const commandName of plugin.provides.commands) {
      const commandPath = path.join(commandsDir, commandName);
      if (await fs.pathExists(commandPath)) {
        commands.push(commandName);
      }
    }

    return commands;
  }

  /**
   * Check if plugin has all required files
   */
  async validatePluginFiles(pluginName: string): Promise<boolean> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin) {
      return false;
    }

    const pluginDir = this.getPluginDir(pluginName);
    const errors: string[] = [];

    // Check skills
    if (plugin.provides.skills) {
      for (const skillName of plugin.provides.skills) {
        const skillPath = path.join(pluginDir, 'skills', skillName, 'SKILL.md');
        if (!(await fs.pathExists(skillPath))) {
          errors.push(`Missing skill file: skills/${skillName}/SKILL.md`);
        }
      }
    }

    // Check agents
    if (plugin.provides.agents) {
      for (const agentName of plugin.provides.agents) {
        const agentPath = path.join(pluginDir, 'agents', agentName);
        if (!(await fs.pathExists(agentPath))) {
          errors.push(`Missing agent file: agents/${agentName}`);
        }
      }
    }

    // Check commands
    if (plugin.provides.commands) {
      for (const commandName of plugin.provides.commands) {
        const commandPath = path.join(pluginDir, 'commands', commandName);
        if (!(await fs.pathExists(commandPath))) {
          errors.push(`Missing command file: commands/${commandName}`);
        }
      }
    }

    // Check skill rules fragment
    if (plugin.provides.skillRulesFragment) {
      const fragmentPath = path.join(
        pluginDir,
        plugin.provides.skillRulesFragment
      );
      if (!(await fs.pathExists(fragmentPath))) {
        errors.push(`Missing skill rules fragment: ${plugin.provides.skillRulesFragment}`);
      }
    }

    if (errors.length > 0) {
      logger.error(`Plugin ${pluginName} validation failed:`);
      errors.forEach((error) => logger.error(`  - ${error}`));
      return false;
    }

    return true;
  }

  /**
   * Get plugin dependencies (other plugins)
   */
  async getPluginDependencies(pluginName: string): Promise<string[]> {
    const plugin = await this.getPlugin(pluginName);
    if (!plugin || !plugin.dependencies?.plugins) {
      return [];
    }

    return plugin.dependencies.plugins;
  }

  /**
   * Check for circular dependencies
   */
  async checkCircularDependencies(
    pluginName: string,
    visited: Set<string> = new Set()
  ): Promise<string | null> {
    if (visited.has(pluginName)) {
      return pluginName; // Circular dependency found
    }

    visited.add(pluginName);

    const dependencies = await this.getPluginDependencies(pluginName);
    for (const dep of dependencies) {
      const circular = await this.checkCircularDependencies(dep, visited);
      if (circular) {
        return circular;
      }
    }

    visited.delete(pluginName);
    return null; // No circular dependencies
  }

  /**
   * Get installation order (resolve dependencies)
   */
  async getInstallationOrder(pluginNames: string[]): Promise<string[]> {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = async (name: string): Promise<void> => {
      if (visited.has(name)) {
        return;
      }

      // Check circular dependencies
      const circular = await this.checkCircularDependencies(name);
      if (circular) {
        throw new Error(
          `Circular dependency detected in plugin ${name}: ${circular}`
        );
      }

      visited.add(name);

      // Visit dependencies first
      const dependencies = await this.getPluginDependencies(name);
      for (const dep of dependencies) {
        await visit(dep);
      }

      // Add this plugin to the order
      order.push(name);
    };

    for (const name of pluginNames) {
      await visit(name);
    }

    return order;
  }

  /**
   * Create installed plugin metadata
   */
  createInstalledPlugin(
    manifest: PluginManifest,
    customPaths?: Record<string, string>
  ): InstalledPlugin {
    return {
      name: manifest.name,
      version: manifest.version,
      installedAt: new Date().toISOString(),
      manifest,
      customPaths,
    };
  }
}
