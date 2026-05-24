#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync, existsSync, mkdirSync, cpSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');

function getDefaults(globalFlag) {
  const base = globalFlag ? resolve(homedir(), '.config', 'opencode') : resolve(process.cwd(), '.opencode');
  return {
    skillsDest: join(base, 'skills'),
    agentsDest: join(base, 'agents'),
  };
}

function frontmatter(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  let currentKey = null;
  let currentValue = '';
  let blockMode = false; // true when we hit a YAML block scalar indicator (>-, |, etc.)
  for (const line of match[1].split(/\r?\n/)) {
    const indent = line.match(/^(\s*)/);
    if (blockMode && indent && indent[1].length >= 2) {
      currentValue += (currentValue ? ' ' : '') + line.trim();
      continue;
    }
    // Save previous key-value pair
    if (currentKey !== null) {
      fm[currentKey.trim()] = (currentValue || '').trim();
      blockMode = false;
    }
    currentKey = null;
    currentValue = '';
    const kv = line.match(/^(\w[\w\s-]*?):\s*(.*)/);
    if (kv) {
      currentKey = kv[1].trim();
      currentValue = kv[2].trim();
      if (/^[>|][-]?$/.test(currentValue)) {
        blockMode = true;
        currentValue = '';
      }
    }
  }
  if (currentKey !== null) {
    fm[currentKey.trim()] = (currentValue || '').trim();
  }
  return fm;
}

function listSkillsDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const skillFile = join(dir, e.name, 'SKILL.md');
      const fm = frontmatter(skillFile);
      return { name: e.name, description: fm.description || '(no description)' };
    });
}

function listAgentsDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => {
      const fm = frontmatter(join(dir, e.name));
      return { name: basename(e.name, '.md'), description: fm.description || '(no description)' };
    });
}

program
  .name('opencode-agent-system')
  .description('Install and manage AgentSystem skills and agents for OpenCode')
  .version('0.1.0');

program
  .command('init')
  .description('Copy skills and agents to target directories')
  .option('--dest <dir>', 'Base directory (skills and agents placed under <dir>/skills/ and <dir>/agents/)', (v) => v, null)
  .option('--agents-dest <dir>', 'Destination for agents only (overrides <dest>/agents/)', (v) => v, null)
  .option('-g, --global', 'Install to ~/.config/opencode/ instead of project .opencode/', false)
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--skip-agents', 'Only install skills', false)
  .action((opts) => {
    try {
      const defaults = getDefaults(opts.global);
      const skillsDest = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
      const agentsDest = opts.agentsDest ? join(opts.agentsDest, 'agents') : (opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest);
      const srcSkills = join(PKG_ROOT, 'skills');
      const srcAgents = join(PKG_ROOT, 'agents');

      let skillsCount = 0;
      let agentsCount = 0;

      if (existsSync(srcSkills)) {
        for (const entry of readdirSync(srcSkills, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const src = join(srcSkills, entry.name);
          const dest = join(skillsDest, entry.name);
          if (existsSync(dest) && !opts.force) {
            console.log(`  skip: skills/${entry.name}/ already exists (use --force to overwrite)`);
            continue;
          }
          if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
          mkdirSync(skillsDest, { recursive: true });
          cpSync(src, dest, { recursive: true });
          skillsCount++;
        }
      }

      if (!opts.skipAgents && existsSync(srcAgents)) {
        for (const entry of readdirSync(srcAgents, { withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
          const src = join(srcAgents, entry.name);
          const dest = join(agentsDest, entry.name);
          if (existsSync(dest) && !opts.force) {
            console.log(`  skip: agents/${entry.name} already exists (use --force to overwrite)`);
            continue;
          }
          mkdirSync(agentsDest, { recursive: true });
          cpSync(src, dest);
          agentsCount++;
        }
      }

      console.log(`Installed ${skillsCount} skills and ${agentsCount} agents to ${skillsDest}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available or installed skills and agents')
  .option('--dest <dir>', 'Show what is installed at this base directory', (v) => v, null)
  .option('-g, --global', 'Show what is installed in ~/.config/opencode/', false)
  .action((opts) => {
    try {
      let skillsDir, agentsDir;
      if (opts.dest || opts.global) {
        const defaults = getDefaults(opts.global);
        skillsDir = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
        agentsDir = opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest;
      } else {
        skillsDir = join(PKG_ROOT, 'skills');
        agentsDir = join(PKG_ROOT, 'agents');
      }

      const skills = listSkillsDir(skillsDir);
      const agents = listAgentsDir(agentsDir);

      const label = opts.dest || opts.global ? 'Installed' : 'Available';

      console.log(`\n${label} skills (${skills.length}):`);
      if (skills.length === 0) {
        console.log('  (none)');
      } else {
        for (const s of skills) {
          console.log(`  ${s.name} — ${s.description}`);
        }
      }

      console.log(`\n${label} agents (${agents.length}):`);
      if (agents.length === 0) {
        console.log('  (none)');
      } else {
        for (const a of agents) {
          console.log(`  ${a.name} — ${a.description}`);
        }
      }
      console.log();
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Remove skills and agents from target directories')
  .option('--dest <dir>', 'Base directory (removes from <dir>/skills/ and <dir>/agents/)', (v) => v, null)
  .option('--agents-dest <dir>', 'Destination for agents only (overrides <dest>/agents/)', (v) => v, null)
  .option('-g, --global', 'Uninstall from ~/.config/opencode/ instead of project .opencode/', false)
  .option('--skip-agents', 'Only uninstall skills', false)
  .action((opts) => {
    try {
      const defaults = getDefaults(opts.global);
      const skillsDest = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
      const agentsDest = opts.agentsDest ? join(opts.agentsDest, 'agents') : (opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest);
      const srcSkills = join(PKG_ROOT, 'skills');
      const srcAgents = join(PKG_ROOT, 'agents');

      let skillsCount = 0;
      let agentsCount = 0;

      if (existsSync(srcSkills)) {
        for (const entry of readdirSync(srcSkills, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const dest = join(skillsDest, entry.name);
          if (existsSync(dest)) {
            rmSync(dest, { recursive: true, force: true });
            skillsCount++;
          }
        }
      }

      if (!opts.skipAgents && existsSync(srcAgents)) {
        for (const entry of readdirSync(srcAgents, { withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
          const dest = join(agentsDest, entry.name);
          if (existsSync(dest)) {
            rmSync(dest, { force: true });
            agentsCount++;
          }
        }
      }

      console.log(`Uninstalled ${skillsCount} skills and ${agentsCount} agents from ${skillsDest}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
