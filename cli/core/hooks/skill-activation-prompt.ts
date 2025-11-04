#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

interface HookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
    prompt: string;
}

interface PromptTriggers {
    keywords?: string[];
    intentPatterns?: string[];
}

interface PostToolUseTriggers {
    enabled: boolean;
    tools: string[];
    minEdits: number;
    withinMinutes: number;
    description?: string;
}

interface SkillRule {
    type: 'guardrail' | 'domain';
    enforcement: 'block' | 'suggest' | 'warn';
    priority: 'critical' | 'high' | 'medium' | 'low';
    promptTriggers?: PromptTriggers;
}

interface AgentRule {
    type: 'workflow';
    activation: 'suggest' | 'auto';
    priority: 'critical' | 'high' | 'medium' | 'low';
    promptTriggers?: PromptTriggers;
    postToolUseTriggers?: PostToolUseTriggers;
}

interface SkillRules {
    version: string;
    skills: Record<string, SkillRule>;
    agents?: Record<string, AgentRule>;
}

interface MatchedSkill {
    name: string;
    matchType: 'keyword' | 'intent';
    config: SkillRule;
}

interface MatchedAgent {
    name: string;
    matchType: 'keyword' | 'intent';
    config: AgentRule;
}

async function main() {
    try {
        // Read input from stdin
        const input = readFileSync(0, 'utf-8');
        const data: HookInput = JSON.parse(input);
        const prompt = data.prompt.toLowerCase();

        // Load skill and agent rules
        const projectDir = process.env.CLAUDE_PROJECT_DIR || '$HOME/project';
        const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');
        const rules: SkillRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

        const matchedSkills: MatchedSkill[] = [];
        const matchedAgents: MatchedAgent[] = [];

        // Check each skill for matches
        for (const [skillName, config] of Object.entries(rules.skills)) {
            const triggers = config.promptTriggers;
            if (!triggers) {
                continue;
            }

            // Keyword matching
            if (triggers.keywords) {
                const keywordMatch = triggers.keywords.some(kw =>
                    prompt.includes(kw.toLowerCase())
                );
                if (keywordMatch) {
                    matchedSkills.push({ name: skillName, matchType: 'keyword', config });
                    continue;
                }
            }

            // Intent pattern matching
            if (triggers.intentPatterns) {
                const intentMatch = triggers.intentPatterns.some(pattern => {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(prompt);
                });
                if (intentMatch) {
                    matchedSkills.push({ name: skillName, matchType: 'intent', config });
                }
            }
        }

        // Check each agent for matches
        if (rules.agents) {
            for (const [agentName, config] of Object.entries(rules.agents)) {
                const triggers = config.promptTriggers;
                if (!triggers) {
                    continue;
                }

                // Keyword matching
                if (triggers.keywords) {
                    const keywordMatch = triggers.keywords.some(kw =>
                        prompt.includes(kw.toLowerCase())
                    );
                    if (keywordMatch) {
                        matchedAgents.push({ name: agentName, matchType: 'keyword', config });
                        continue;
                    }
                }

                // Intent pattern matching
                if (triggers.intentPatterns) {
                    const intentMatch = triggers.intentPatterns.some(pattern => {
                        const regex = new RegExp(pattern, 'i');
                        return regex.test(prompt);
                    });
                    if (intentMatch) {
                        matchedAgents.push({ name: agentName, matchType: 'intent', config });
                    }
                }
            }
        }

        // Generate output if matches found
        if (matchedSkills.length > 0 || matchedAgents.length > 0) {
            let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            output += '🎯 SKILL ACTIVATION CHECK\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            // Group by priority
            const critical = matchedSkills.filter(s => s.config.priority === 'critical');
            const high = matchedSkills.filter(s => s.config.priority === 'high');
            const medium = matchedSkills.filter(s => s.config.priority === 'medium');
            const low = matchedSkills.filter(s => s.config.priority === 'low');

            if (critical.length > 0) {
                output += '⚠️ CRITICAL SKILLS (REQUIRED):\n';
                critical.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (high.length > 0) {
                output += '📚 RECOMMENDED SKILLS:\n';
                high.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (medium.length > 0) {
                output += '💡 SUGGESTED SKILLS:\n';
                medium.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (low.length > 0) {
                output += '📌 OPTIONAL SKILLS:\n';
                low.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (matchedSkills.length > 0) {
                output += 'ACTION: Use Skill tool BEFORE responding\n';
            }

            if (matchedAgents.length > 0) {
                output += '\n💡 RECOMMENDED AGENTS:\n';

                // Group agents by priority
                const criticalAgents = matchedAgents.filter(a => a.config.priority === 'critical');
                const highAgents = matchedAgents.filter(a => a.config.priority === 'high');
                const mediumAgents = matchedAgents.filter(a => a.config.priority === 'medium');
                const lowAgents = matchedAgents.filter(a => a.config.priority === 'low');

                if (criticalAgents.length > 0) {
                    output += '⚠️ CRITICAL:\n';
                    criticalAgents.forEach(a => output += `  → ${a.name}\n`);
                }

                if (highAgents.length > 0) {
                    output += '🎯 HIGH PRIORITY:\n';
                    highAgents.forEach(a => output += `  → ${a.name}\n`);
                }

                if (mediumAgents.length > 0) {
                    output += '📋 SUGGESTED:\n';
                    mediumAgents.forEach(a => output += `  → ${a.name}\n`);
                }

                if (lowAgents.length > 0) {
                    output += '💭 OPTIONAL:\n';
                    lowAgents.forEach(a => output += `  → ${a.name}\n`);
                }

                // Output strong activation instruction with actual agent names
                const highPriorityAgents = [...criticalAgents, ...highAgents];
                if (highPriorityAgents.length > 0) {
                    const agentNames = highPriorityAgents.map(a => a.name).join(' or ');
                    output += `\nACTION: Use Task tool with subagent_type=${highPriorityAgents[0].name} BEFORE responding\n`;
                } else if (mediumAgents.length > 0) {
                    output += `\nACTION: Consider using Task tool with subagent_type=${mediumAgents[0].name}\n`;
                }
            }

            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

            console.log(output);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error in skill-activation-prompt hook:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Uncaught error:', err);
    process.exit(1);
});
