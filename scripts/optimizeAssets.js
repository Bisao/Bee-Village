
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      await optimizeImages(filePath);
      continue;
    }
    
    if (!['.png', '.jpg', '.jpeg'].includes(path.extname(file))) continue;
    
    await sharp(filePath)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(filePath.replace(/\.[^/.]+$/, '') + '_optimized.png');
  }
}

optimizeImages('./game/assets');
