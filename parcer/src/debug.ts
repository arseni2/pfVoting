import { chromium } from 'playwright';
import * as fs from 'fs';

async function debug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Переход на страницу...');
  await page.goto('https://pizzafabrika.ru/vologda', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Find and extract the big script with product data
  const scriptContent = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    
    for (const script of scripts) {
      const content = script.textContent;
      if (content && content.length > 100000 && content.includes('catalog')) {
        return content;
      }
    }
    return null;
  });
  
  if (!scriptContent) {
    console.log('Скрипт не найден');
    await browser.close();
    return;
  }
  
  console.log(`Найден скрипт длиной: ${scriptContent.length} символов`);
  
  // Extract the JSON string from Next.js format
  const match = scriptContent.match(/\[1,"([\s\S]+)"\]/);
  
  if (!match) {
    console.log('Не удалось извлечь строку');
    await browser.close();
    return;
  }
  
  let jsonString = match[1];
  
  // Unescape - order matters! Do \\\\ first, then others
  // But we need to be careful not to double-unescape
  
  // First handle special sequences that should stay escaped in JSON strings
  jsonString = jsonString.replace(/\\r\\n/g, '\\n'); // Normalize line endings
  
  // Now unescape the Next.js escaping
  jsonString = jsonString.replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
  
  // The data starts with something like: 6a:[["$","script",...
  // We need to find the catalog object within this string
  
  // Find "catalog":{...} with balanced braces
  const catalogStart = jsonString.indexOf('"catalog":{');
  if (catalogStart === -1) {
    console.log('Не найден catalog');
    await browser.close();
    return;
  }
  
  // Find the end of the catalog object by counting braces
  let braceCount = 0;
  let inString = false;
  let escape = false;
  let catalogEnd = catalogStart;
  
  for (let i = catalogStart + 10; i < jsonString.length; i++) {
    const char = jsonString[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          catalogEnd = i + 1;
          break;
        }
      }
    }
  }
  
  const catalogJson = jsonString.substring(catalogStart, catalogEnd);
  console.log(`Длина catalog JSON: ${catalogJson.length}`);
  
  try {
    // Parse just the catalog part
    const catalogStr = catalogJson.substring('"catalog":'.length);
    const catalog = JSON.parse(catalogStr);
    
    console.log('Успешно распарсено!');
    console.log(`Категорий: ${catalog.categories?.length || 0}`);
    
    if (catalog.categories && catalog.categories.length > 0) {
      console.log('\n=== ПЕРВАЯ КАТЕГОРИЯ ===');
      console.log(`Title: ${catalog.categories[0].title}`);
      console.log(`Caption: ${catalog.categories[0].caption}`);
      console.log(`Items: ${catalog.categories[0].items?.length || 0}`);
      
      console.log('\n=== ПЕРВЫЕ 3 ЭЛЕМЕНТА ===');
      catalog.categories[0].items?.slice(0, 3).forEach((item: any, i: number) => {
        console.log(`${i + 1}. ${item.title} - products: [${item.products?.join(', ')}]`);
      });
    }
    
    // Count total unique product IDs
    const productIds = new Set<number>();
    catalog.categories?.forEach((cat: any) => {
      cat.items?.forEach((item: any) => {
        item.products?.forEach((id: number) => productIds.add(id));
      });
    });
    
    console.log(`\nУникальных product ID: ${productIds.size}`);
    console.log('Примеры ID:', Array.from(productIds).slice(0, 20));
    
    // Save catalog
    fs.writeFileSync('debug-catalog.json', JSON.stringify(catalog, null, 2));
    console.log('\nКаталог сохранён в debug-catalog.json');
    
    // Now look for products data in the same script
    // Find "products":{...} with balanced braces
    const productsStart = jsonString.indexOf('"products":{');
    console.log('\n=== ПОИСК PRODUCTS ===');
    console.log(`productsStart: ${productsStart}`);
    
    // Show what's around products
    if (productsStart !== -1) {
      console.log(`Контекст: ${jsonString.substring(productsStart, productsStart + 200)}`);
    }
    
    // Also search for individual product data like "114":{...}
    const productIdPattern = /"(\d+)":\{[^{}]*"id":\1/g;
    const matches = jsonString.match(productIdPattern);
    console.log(`Найдено product деталей с pattern: ${matches?.length || 0}`);
    
    if (matches && matches.length > 0) {
      console.log('Примеры:', matches.slice(0, 3));
    }
    
    if (productsStart !== -1) {
      console.log('\n=== ПОИСК PRODUCTS ===');
      
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let productsEnd = productsStart;
      
      for (let i = productsStart + 12; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escape) {
          escape = false;
          continue;
        }
        
        if (char === '\\') {
          escape = true;
          continue;
        }
        
        if (char === '"' && !escape) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              productsEnd = i + 1;
              break;
            }
          }
        }
      }
      
      const productsJson = jsonString.substring(productsStart, productsEnd);
      console.log(`Длина products JSON: ${productsJson.length}`);
      
      try {
        const productsStr = productsJson.substring('"products":'.length);
        const products = JSON.parse(productsStr);
        console.log(`Распарсено продуктов: ${Object.keys(products).length}`);
        
        if (Object.keys(products).length > 0) {
          const firstKey = Object.keys(products)[0];
          console.log('\n=== ПЕРВЫЙ ПРОДУКТ ===');
          console.log(`ID: ${firstKey}`);
          console.log(`Title: ${products[firstKey].title}`);
          console.log(`Keys: ${Object.keys(products[firstKey]).join(', ')}`);
        }
        
        fs.writeFileSync('debug-products.json', JSON.stringify(products, null, 2));
        console.log('\nПродукты сохранены в debug-products.json');
      } catch (e: any) {
        console.log('Не удалось распарсить products:', e.message);
      }
    } else {
      console.log('\nProducts не найдены в скрипте');
    }
    
    // Look for parameters
    const paramsStart = jsonString.indexOf('"parameters":{');
    console.log('\n=== ПОИСК PARAMETERS ===');
    console.log(`paramsStart: ${paramsStart}`);
    
    if (paramsStart !== -1) {
      console.log(`Контекст: ${jsonString.substring(paramsStart, paramsStart + 500)}`);
    }
    
    if (paramsStart !== -1) {
      console.log('\n=== ПОИСК PARAMETERS ===');
      
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let paramsEnd = paramsStart;
      
      for (let i = paramsStart + 14; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escape) {
          escape = false;
          continue;
        }
        
        if (char === '\\') {
          escape = true;
          continue;
        }
        
        if (char === '"' && !escape) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              paramsEnd = i + 1;
              break;
            }
          }
        }
      }
      
      const paramsJson = jsonString.substring(paramsStart, paramsEnd);
      
      try {
        const paramsStr = paramsJson.substring('"parameters":'.length);
        const parameters = JSON.parse(paramsStr);
        console.log('Parameters найдены:', JSON.stringify(parameters, null, 2).substring(0, 500));
        fs.writeFileSync('debug-parameters.json', JSON.stringify(parameters, null, 2));
      } catch (e: any) {
        console.log('Не удалось распарсить parameters:', e.message);
      }
    }
    
  } catch (e: any) {
    console.log('Ошибка парсинга catalog:', e.message);
    console.log('Первые 500 символов:', catalogJson.substring(0, 500));
  }
  
  await browser.close();
}

debug().catch(console.error);
