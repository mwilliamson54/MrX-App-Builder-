// setup-project.js
// Run this with: node setup-project.js

const fs = require('fs');
const path = require('path');

const structure = {
  'functions': {
    '_middleware.ts': '',
    'api': {
      'projects': {
        'index.ts': '',
        '[projectId]': {
          'index.ts': '',
          'artifacts': {
            'index.ts': ''
          },
          'chats': {
            'index.ts': '',
            '[chatId]': {
              'messages': {
                'index.ts': ''
              }
            }
          }
        }
      },
      'jobs': {
        'create.ts': '',
        'claim.ts': '',
        '[jobId]': {
          'index.ts': '',
          'logs.ts': ''
        }
      },
      'admin': {
        'secrets': {
          'index.ts': '',
          '[projectId].ts': ''
        }
      }
    }
  },
  'lib': {
    'kv': {
      'projects.ts': '',
      'chats.ts': '',
      'messages.ts': '',
      'jobs.ts': '',
      'logs.ts': '',
      'artifacts.ts': '',
      'secrets.ts': ''
    },
    'auth': {
      'session.ts': '',
      'colab.ts': '',
      'admin.ts': '',
      'cors.ts': ''
    },
    'crypto': {
      'encryption.ts': '',
      'tokens.ts': '',
      'jwt.ts': ''
    },
    'github': {
      'client.ts': '',
      'repos.ts': ''
    },
    'utils': {
      'errors.ts': '',
      'logger.ts': '',
      'pagination.ts': '',
      'generators.ts': '',
      'dates.ts': '',
      'validation.ts': ''
    }
  },
  'types': {
    'index.ts': ''
  },
  'wrangler.toml': '',
  'package.json': '',
  'tsconfig.json': '',
  'README.md': ''
};

function createStructure(basePath, struct) {
  Object.entries(struct).forEach(([name, content]) => {
    const fullPath = path.join(basePath, name);
    
    if (typeof content === 'object' && !Array.isArray(content)) {
      // It's a directory
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✓ Created folder: ${fullPath}`);
      }
      createStructure(fullPath, content);
    } else {
      // It's a file
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content || '');
        console.log(`✓ Created file: ${fullPath}`);
      }
    }
  });
}

console.log('🚀 Creating MrX Backend project structure...\n');

const projectRoot = process.cwd();
createStructure(projectRoot, structure);

console.log('\n✅ Project structure created successfully!');
console.log('\nNext steps:');
console.log('1. Copy the code from the artifacts into each file');
console.log('2. Run: npm install');
console.log('3. Update wrangler.toml with your settings');
console.log('4. Run: npm run build');
console.log('5. Deploy: wrangler pages deploy dist');