/**
 * JSON Schemas for validation
 */

export const pluginManifestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['name', 'version', 'displayName', 'description', 'author', 'compatibility', 'provides'],
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      description: 'Plugin name (lowercase, alphanumeric with hyphens)',
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(?:-[a-z0-9.]+)?$',
      description: 'Semver version',
    },
    displayName: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Human-readable plugin name',
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 500,
      description: 'Plugin description',
    },
    author: {
      type: 'string',
      minLength: 1,
      description: 'Author name and email (e.g., "Name <email@example.com>")',
    },
    homepage: {
      type: 'string',
      format: 'uri',
      description: 'Plugin homepage URL',
    },
    repository: {
      type: 'object',
      required: ['type', 'url'],
      properties: {
        type: {
          type: 'string',
          enum: ['git', 'svn', 'hg'],
        },
        url: {
          type: 'string',
          format: 'uri',
        },
      },
    },
    keywords: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z0-9-]+$',
      },
      uniqueItems: true,
      description: 'Keywords for plugin discovery',
    },
    compatibility: {
      type: 'object',
      required: ['claudeCode', 'node'],
      properties: {
        claudeCode: {
          type: 'string',
          description: 'Claude Code version range (semver)',
        },
        node: {
          type: 'string',
          description: 'Node.js version range (semver)',
        },
      },
    },
    provides: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
          },
          uniqueItems: true,
          description: 'List of skill directory names',
        },
        agents: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+\\.md$',
          },
          uniqueItems: true,
          description: 'List of agent file names',
        },
        commands: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+\\.md$',
          },
          uniqueItems: true,
          description: 'List of command file names',
        },
        hooks: {
          type: 'array',
          items: {
            type: 'string',
          },
          uniqueItems: true,
          description: 'List of hook file names',
        },
        skillRulesFragment: {
          type: 'string',
          description: 'Path to skill-rules.fragment.json',
        },
      },
    },
    dependencies: {
      type: 'object',
      properties: {
        plugins: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
          },
          uniqueItems: true,
          description: 'Required plugins',
        },
        npm: {
          type: 'object',
          patternProperties: {
            '^[a-z0-9@/-]+$': {
              type: 'string',
              description: 'NPM package version range',
            },
          },
          description: 'NPM dependencies',
        },
      },
    },
    pathPatterns: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9_]+$': {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      description: 'Framework detection path patterns',
    },
    contentPatterns: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9_]+$': {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      description: 'Framework detection content patterns',
    },
    templates: {
      type: 'object',
      properties: {
        paths: {
          type: 'object',
          patternProperties: {
            '^[A-Z_]+$': {
              type: 'string',
            },
          },
          description: 'Template path variables and defaults',
        },
      },
    },
    prompts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'name', 'message'],
        properties: {
          type: {
            type: 'string',
            enum: ['input', 'confirm', 'list', 'checkbox'],
          },
          name: {
            type: 'string',
            pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$',
          },
          message: {
            type: 'string',
            minLength: 1,
          },
          default: {},
          choices: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'value'],
              properties: {
                name: {
                  type: 'string',
                },
                value: {},
              },
            },
          },
          when: {
            type: 'string',
            description: 'Condition expression',
          },
        },
      },
      description: 'Interactive prompts during installation',
    },
  },
};

export const skillRulesFragmentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['skills'],
  properties: {
    skills: {
      type: 'object',
      patternProperties: {
        '^[a-z0-9-]+$': {
          type: 'object',
          required: ['type', 'enforcement', 'priority'],
          properties: {
            type: {
              type: 'string',
              enum: ['domain', 'guardrail'],
            },
            enforcement: {
              type: 'string',
              enum: ['suggest', 'block', 'warn'],
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
            },
            promptTriggers: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
                intentPatterns: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
              },
            },
            fileTriggers: {
              type: 'object',
              properties: {
                pathPatterns: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
                pathExclusions: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
                contentPatterns: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

export const cliConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['version', 'installedAt', 'plugins', 'customPaths'],
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
    installedAt: {
      type: 'string',
      format: 'date-time',
    },
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'version', 'installedAt'],
        properties: {
          name: {
            type: 'string',
            pattern: '^[a-z0-9-]+$',
          },
          version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+\\.\\d+',
          },
          installedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    customPaths: {
      type: 'object',
      patternProperties: {
        '^[A-Z_]+$': {
          type: 'string',
        },
      },
    },
    settings: {
      type: 'object',
      properties: {
        autoUpdate: {
          type: 'boolean',
        },
        analyticsEnabled: {
          type: 'boolean',
        },
      },
    },
  },
};
