const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  if (!fs.existsSync(from)) {
    return;
  }
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

function copyFileSync(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`Aviso: Arquivo de origem não encontrado para cópia: ${from}`);
    return;
  }
  const dir = path.dirname(to);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(from, to);
}

function copyStaticFiles() {
  console.log('Copiando arquivos estáticos...');
  copyFileSync('src/manifest.json', 'dist/manifest.json');
  copyFileSync('src/ui/popup/popup.html', 'dist/popup.html');
  copyFileSync('src/ui/popup/popup.css', 'dist/popup.css');
  copyFileSync('mock/mock_panel.html', 'dist/mock_panel.html');
  copyFileSync('mock/mock_panel.css', 'dist/mock_panel.css');
  
  if (fs.existsSync('assets/icons')) {
    copyFolderSync('assets/icons', 'dist/icons');
  } else {
    // Garantir que a pasta dist/icons exista
    fs.mkdirSync('dist/icons', { recursive: true });
  }
}

async function build() {
  const isWatch = process.argv.includes('--watch');

  const config = {
    entryPoints: {
      content: 'src/core/content.ts',
      background: 'src/background.ts',
      popup: 'src/ui/popup/popup.ts'
    },
    bundle: true,
    outdir: 'dist',
    minify: false, // Mantido legível para auditoria e depuração
    sourcemap: true,
    target: ['chrome100'],
    logLevel: 'info',
  };

  // Limpar ou criar diretório dist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  copyStaticFiles();

  if (isWatch) {
    console.log('Iniciando modo observador (watch mode)...');
    const ctx = await esbuild.context(config);
    await ctx.watch();
    
    // Observar arquivos HTML/CSS estáticos manualmente para recopiá-los
    const watchPaths = [
      'src/manifest.json',
      'src/ui/popup/popup.html',
      'src/ui/popup/popup.css',
      'mock/mock_panel.html',
      'mock/mock_panel.css'
    ];
    
    watchPaths.forEach(file => {
      if (fs.existsSync(file)) {
        fs.watchFile(file, () => {
          console.log(`Arquivo estático alterado: ${file}. Recopiando...`);
          copyStaticFiles();
        });
      }
    });
  } else {
    await esbuild.build(config);
    console.log('Compilação concluída com sucesso!');
  }
}

build().catch(err => {
  console.error('Falha na compilação:', err);
  process.exit(1);
});
