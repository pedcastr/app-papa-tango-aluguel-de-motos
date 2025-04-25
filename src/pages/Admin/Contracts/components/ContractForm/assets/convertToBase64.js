// Este script é usado para converter imagens para base64
// Execute-o separadamente para gerar os arquivos base64 necessários
const fs = require('fs');
const path = require('path');

// Função para converter imagem para base64
function convertImageToBase64(filePath) {
  try {
    // Ler o arquivo
    const fileData = fs.readFileSync(filePath);
    
    // Converter para base64
    const base64Data = fileData.toString('base64');
    
    // Obter o nome do arquivo sem extensão
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Escrever o arquivo base64 como .js (não .base64.js)
    fs.writeFileSync(
      `${fileName}.js`,
      `export default '${base64Data}';`
    );
    
    console.log(`Arquivo ${fileName}.js criado com sucesso!`);
    
    // Retornar os dados para uso no arquivo combinado
    return {
      name: fileName,
      data: base64Data
    };
  } catch (error) {
    console.error(`Erro ao converter ${filePath}:`, error);
    return null;
  }
}

// Lista de imagens para converter
const images = [
  'logoPapaTango.png',
  'rodapeEsquerdo.png',
  'rodapeDireito.png',
  'rodapeBaixoDireito.png'
];

// Converter cada imagem individualmente
const convertedImages = images.map(img => convertImageToBase64(img)).filter(Boolean);

// Criar um único arquivo com todas as imagens
let combinedContent = '// Arquivo gerado automaticamente com todas as imagens em base64\n\n';

convertedImages.forEach(img => {
  combinedContent += `export const ${img.name} = '${img.data}';\n\n`;
});

// Escrever o arquivo combinado
fs.writeFileSync('images.js', combinedContent);
console.log('Arquivo images.js com todas as imagens criado com sucesso!');
