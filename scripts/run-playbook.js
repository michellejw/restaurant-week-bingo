#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLAYBOOKS = {
  'start-season': {
    title: 'Start Season',
    file: 'ops/playbooks/start-season.yaml',
  },
  'close-season': {
    title: 'Close Season',
    file: 'ops/playbooks/close-season.yaml',
  },
  'ai-start': {
    title: 'AI New Season Assistant',
    file: 'ops/ai/new-season-assistant.md',
  },
  'ai-close': {
    title: 'AI Close Season Assistant',
    file: 'ops/ai/close-season-assistant.md',
  },
};

function usage() {
  console.log('Usage: node scripts/run-playbook.js <name> [--full]');
  console.log('');
  console.log('Available names:');
  Object.keys(PLAYBOOKS).forEach((name) => {
    console.log(`  - ${name}`);
  });
}

function readFile(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return {
    absolutePath,
    content: fs.readFileSync(absolutePath, 'utf8'),
  };
}

function extractYamlStepTitles(content) {
  const lines = content.split('\n');
  const stepIds = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('- id: ')) {
      continue;
    }

    const id = line.replace('- id: ', '').trim();
    const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
    const title = nextLine.startsWith('title: ') ? nextLine.replace('title: ', '').trim() : '(untitled)';
    stepIds.push({ id, title });
  }

  return stepIds;
}

function main() {
  const [, , name, ...rest] = process.argv;
  const full = rest.includes('--full');

  if (!name || !PLAYBOOKS[name]) {
    usage();
    process.exit(name ? 1 : 0);
  }

  const selected = PLAYBOOKS[name];
  const envMap = readFile('ops/environment-map.md');
  const playbook = readFile(selected.file);

  console.log(`\n# ${selected.title}`);
  console.log(`Playbook: ${selected.file}`);
  console.log(`Environment map: ops/environment-map.md`);

  if (selected.file.endsWith('.yaml')) {
    const steps = extractYamlStepTitles(playbook.content);
    if (steps.length > 0) {
      console.log('\nSteps:');
      steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.id} - ${step.title}`);
      });
    }
  }

  if (full) {
    console.log('\n--- ops/environment-map.md ---\n');
    console.log(envMap.content.trim());
    console.log(`\n--- ${selected.file} ---\n`);
    console.log(playbook.content.trim());
  } else {
    console.log('\nTip: add --full to print the complete playbook text.');
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
