#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync, existsSync, mkdirSync, cpSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { symlinkSync, unlinkSync, lstatSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..');

function getDefaults(globalFlag) {
  const base = globalFlag ? resolve(homedir(), '.config', 'opencode') : resolve(process.cwd(), '.opencode');
  return {
    skillsDest: join(base, 'skills'),
    agentsDest: join(base, 'agents'),
    configDest: base,
    instructionsDest: join(base, 'instructions'),
    pluginsDest: join(base, 'plugin'),
    commandsDest: join(base, 'commands'),
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
  let blockMode = false;
  for (const line of match[1].split(/\r?\n/)) {
    const indent = line.match(/^(\s*)/);
    if (blockMode && indent && indent[1].length >= 2) {
      currentValue += (currentValue ? ' ' : '') + line.trim();
      continue;
    }
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

function copyDirContents(src, dest, opts) {
  if (!existsSync(src)) return 0;
  let count = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (existsSync(destPath) && !opts.force) {
        console.log(`  skip: ${entry.name}/ already exists (use --force to overwrite)`);
        continue;
      }
      if (existsSync(destPath)) rmSync(destPath, { recursive: true, force: true });
      mkdirSync(dest, { recursive: true });
      cpSync(srcPath, destPath, { recursive: true });
      count++;
    } else {
      if (existsSync(destPath) && !opts.force) {
        console.log(`  skip: ${entry.name} already exists (use --force to overwrite)`);
        continue;
      }
      mkdirSync(dest, { recursive: true });
      cpSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

program
  .name('opencode-agent-system')
  .description('Install and manage OpenCode Agent System: skills, agents, config, plugins, and more')
  .version('0.2.0');

program
  .command('init')
  .description('Copy skills, agents, and config to target directories')
  .option('--dest <dir>', 'Base directory', (v) => v, null)
  .option('--agents-dest <dir>', 'Destination for agents only', (v) => v, null)
  .option('-g, --global', 'Install to ~/.config/opencode/ instead of project .opencode/', false)
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--skip-agents', 'Skip installing agents', false)
  .option('--skip-config', 'Skip installing config files (instructions, plugins, commands)', false)
  .option('--skip-skills', 'Skip installing skills', false)
  .action((opts) => {
    try {
      const defaults = getDefaults(opts.global);
      const skillsDest = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
      const agentsDest = opts.agentsDest ? join(opts.agentsDest, 'agents') : (opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest);
      const configDest = opts.dest || defaults.configDest;
      const srcSkills = join(PKG_ROOT, 'skills');
      const srcAgents = join(PKG_ROOT, 'agents');
      const srcConfig = join(PKG_ROOT, 'config');

      let skillsCount = 0;
      let agentsCount = 0;
      let configCount = 0;

      // Skills
      if (!opts.skipSkills && existsSync(srcSkills)) {
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

      // Agents
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

      // Config files
      if (!opts.skipConfig && existsSync(srcConfig)) {
        // Instructions
        const srcInstructions = join(srcConfig, 'instructions');
        const destInstructions = join(configDest, 'instructions');
        if (existsSync(srcInstructions)) {
          configCount += copyDirContents(srcInstructions, destInstructions, opts);
        }

        // Plugins
        const srcPlugins = join(srcConfig, 'plugins');
        const destPlugins = opts.global ? join(configDest, 'plugin') : join(configDest, 'plugin');
        if (existsSync(srcPlugins)) {
          configCount += copyDirContents(srcPlugins, destPlugins, opts);
        }

        // Commands
        const srcCommands = join(srcConfig, 'commands');
        const destCommands = join(configDest, 'commands');
        if (existsSync(srcCommands)) {
          configCount += copyDirContents(srcCommands, destCommands, opts);
        }

        // opencode.jsonc
        const srcJsonc = join(srcConfig, 'opencode.jsonc');
        const destJsonc = join(configDest, 'opencode.jsonc');
        if (existsSync(srcJsonc)) {
          if (existsSync(destJsonc) && !opts.force) {
            console.log(`  skip: opencode.jsonc already exists (use --force to overwrite)`);
          } else {
            cpSync(srcJsonc, destJsonc);
            configCount++;
          }
        }

        // AGENTS.md
        const srcAgents2 = join(srcConfig, 'AGENTS.md');
        const destAgents2 = join(configDest, 'AGENTS.md');
        if (existsSync(srcAgents2)) {
          if (existsSync(destAgents2) && !opts.force) {
            console.log(`  skip: AGENTS.md already exists (use --force to overwrite)`);
          } else {
            cpSync(srcAgents2, destAgents2);
            configCount++;
          }
        }
      }

      // Ponytail (git submodule at repo root, vendored to ~/.config/opencode/ponytail/)
      // Plugin path: ./ponytail/.opencode/plugins/ponytail.mjs (relative to opencode.jsonc)
      // 6 commands are symlinked from the vendored copy into configDest/commands/
      // 6 skills are auto-discovered by the plugin via config.skills.paths
      const srcPonytail = join(PKG_ROOT, 'ponytail');
      const destPonytail = join(configDest, 'ponytail');
      if (existsSync(srcPonytail) && existsSync(join(srcPonytail, '.opencode', 'plugins', 'ponytail.mjs'))) {
        if (existsSync(destPonytail) && !opts.force) {
          console.log(`  skip: ponytail/ already exists (use --force to overwrite)`);
        } else {
          if (existsSync(destPonytail)) rmSync(destPonytail, { recursive: true, force: true });
          cpSync(srcPonytail, destPonytail, { recursive: true });
          configCount++;
        }

        // Symlink 6 commands
        const srcPtCommands = join(srcPonytail, '.opencode', 'command');
        const destCommandsDir = join(configDest, 'commands');
        if (existsSync(srcPtCommands) && existsSync(destCommandsDir)) {
          for (const cmd of readdirSync(srcPtCommands)) {
            if (!cmd.startsWith('ponytail')) continue;
            const link = join(destCommandsDir, cmd);
            const target = join(destPonytail, '.opencode', 'command', cmd);
            try {
              if (lstatSync(link).isSymbolicLink() || lstatSync(link).isFile()) unlinkSync(link);
            } catch (e) { /* not present */ }
            try {
              symlinkSync(target, link);
              configCount++;
            } catch (e) {
              console.log(`  warn: could not symlink ${cmd}: ${e.message}`);
            }
          }
        }

        // Ponytail mode config (~/.config/ponytail/config.json)
        const ptConfigDir = join(homedir(), '.config', 'ponytail');
        const ptConfigFile = join(ptConfigDir, 'config.json');
        if (!existsSync(ptConfigFile)) {
          mkdirSync(ptConfigDir, { recursive: true });
          writeFileSync(ptConfigFile, JSON.stringify({ defaultMode: 'full' }, null, 2) + '\n');
          console.log(`  created: ${ptConfigFile} (defaultMode: full)`);
          configCount++;
        }
      } else if (!opts.skipConfig) {
        console.log('  warn: ponytail/ submodule not initialized; run `git submodule update --init` then re-run init');
      }

      console.log(`\nInstalled:`);
      if (!opts.skipSkills) console.log(`  ${skillsCount} skills → ${skillsDest}`);
      if (!opts.skipAgents) console.log(`  ${agentsCount} agents → ${agentsDest}`);
      if (!opts.skipConfig) console.log(`  ${configCount} config files → ${configDest}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available or installed skills, agents, and config')
  .option('--dest <dir>', 'Show what is installed at this base directory', (v) => v, null)
  .option('-g, --global', 'Show what is installed in ~/.config/opencode/', false)
  .action((opts) => {
    try {
      let skillsDir, agentsDir, configDir;
      if (opts.dest || opts.global) {
        const defaults = getDefaults(opts.global);
        skillsDir = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
        agentsDir = opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest;
        configDir = opts.dest || defaults.configDest;
      } else {
        skillsDir = join(PKG_ROOT, 'skills');
        agentsDir = join(PKG_ROOT, 'agents');
        configDir = join(PKG_ROOT, 'config');
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

      // Config files
      console.log(`\n${label} config:`);
      const configItems = [];
      const instructionsDir = join(configDir, 'instructions');
      const pluginsDir = join(configDir, 'plugins');
      const commandsDir = join(configDir, 'commands');

      if (existsSync(instructionsDir)) {
        const instrFiles = readdirSync(instructionsDir).filter(f => f.endsWith('.md'));
        configItems.push(`  instructions: ${instrFiles.length} files`);
      }
      if (existsSync(pluginsDir)) {
        const pluginFiles = readdirSync(pluginsDir).filter(f => f.endsWith('.ts'));
        configItems.push(`  plugins: ${pluginFiles.length} files`);
      }
      if (existsSync(commandsDir)) {
        const cmdFiles = readdirSync(commandsDir).filter(f => f.endsWith('.md'));
        configItems.push(`  commands: ${cmdFiles.length} files`);
      }
      if (existsSync(join(configDir, 'opencode.jsonc'))) {
        configItems.push(`  opencode.jsonc: present`);
      }
      if (existsSync(join(configDir, 'AGENTS.md'))) {
        configItems.push(`  AGENTS.md: present`);
      }
      const ponytailDir = join(configDir, 'ponytail');
      if (existsSync(ponytailDir)) {
        const skillCount = readdirSync(join(ponytailDir, 'skills'), { withFileTypes: true })
          .filter(e => e.isDirectory()).length;
        configItems.push(`  ponytail: vendored (${skillCount} skills)`);
      }

      if (configItems.length === 0) {
        console.log('  (none)');
      } else {
        for (const item of configItems) {
          console.log(item);
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
  .description('Remove skills, agents, and config from target directories')
  .option('--dest <dir>', 'Base directory', (v) => v, null)
  .option('--agents-dest <dir>', 'Destination for agents only', (v) => v, null)
  .option('-g, --global', 'Uninstall from ~/.config/opencode/ instead of project .opencode/', false)
  .option('--skip-agents', 'Skip uninstalling agents', false)
  .option('--skip-config', 'Skip uninstalling config files', false)
  .option('--skip-skills', 'Skip uninstalling skills', false)
  .action((opts) => {
    try {
      const defaults = getDefaults(opts.global);
      const skillsDest = opts.dest ? join(opts.dest, 'skills') : defaults.skillsDest;
      const agentsDest = opts.agentsDest ? join(opts.agentsDest, 'agents') : (opts.dest ? join(opts.dest, 'agents') : defaults.agentsDest);
      const configDest = opts.dest || defaults.configDest;
      const srcSkills = join(PKG_ROOT, 'skills');
      const srcAgents = join(PKG_ROOT, 'agents');

      let skillsCount = 0;
      let agentsCount = 0;
      let configCount = 0;

      // Skills
      if (!opts.skipSkills && existsSync(srcSkills)) {
        for (const entry of readdirSync(srcSkills, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const dest = join(skillsDest, entry.name);
          if (existsSync(dest)) {
            rmSync(dest, { recursive: true, force: true });
            skillsCount++;
          }
        }
      }

      // Agents
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

      // Config
      if (!opts.skipConfig) {
        const configItems = [
          join(configDest, 'instructions'),
          join(configDest, 'plugin'),
          join(configDest, 'commands'),
          join(configDest, 'opencode.jsonc'),
          join(configDest, 'AGENTS.md'),
          join(configDest, 'ponytail'),
        ];
        for (const item of configItems) {
          if (existsSync(item)) {
            rmSync(item, { recursive: true, force: true });
            configCount++;
          }
        }
      }

      console.log(`\nUninstalled:`);
      if (!opts.skipSkills) console.log(`  ${skillsCount} skills from ${skillsDest}`);
      if (!opts.skipAgents) console.log(`  ${agentsCount} agents from ${agentsDest}`);
      if (!opts.skipConfig) console.log(`  ${configCount} config items from ${configDest}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Run the full setup script (installs node, opencode, npm packages, and config)')
  .option('--dry-run', 'Show what would be done without executing', false)
  .action((opts) => {
    try {
      const setupScript = join(PKG_ROOT, 'scripts', 'setup.sh');
      if (!existsSync(setupScript)) {
        console.error('Error: scripts/setup.sh not found');
        process.exit(1);
      }

      if (opts.dryRun) {
        console.log('Dry run mode. Would execute:');
        console.log(`  bash ${setupScript}`);
        console.log('\nThis would:');
        console.log('  1. Install nvm + Node.js 24.x');
        console.log('  2. Install OpenCode binary');
        console.log('  3. Install global npm packages (MCPs, LSPs)');
        console.log('  4. Copy config files to ~/.config/opencode/');
        console.log('  5. Install wrapper script to ~/.local/bin/');
        return;
      }

      console.log('Running setup script...');
      execSync(`bash "${setupScript}"`, { stdio: 'inherit', cwd: PKG_ROOT });
    } catch (err) {
      console.error(`Setup failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
