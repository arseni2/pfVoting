import { Page } from 'playwright';
import { ParsedMenuData, Category, CategoryItem, Product } from './types.js';

export class MenuParser {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async parseMenu(): Promise<ParsedMenuData> {
    // Navigate to page if not already there
    const currentUrl = this.page.url();
    if (!currentUrl.includes('pizzafabrika.ru')) {
      await this.page.goto('https://pizzafabrika.ru/vologda', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    
    // Wait for content
    await this.page.waitForTimeout(3000);
    
    // Extract the script with embedded data
    const scriptContent = await this.page.evaluate(() => {
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
      throw new Error('Не удалось найти скрипт с данными');
    }
    
    // Parse the Next.js RSC format
    const data = this.parseNextJsData(scriptContent);
    
    console.log(`Категорий: ${data.categories.length}`);
    console.log(`Продуктов: ${Object.keys(data.products).length}`);
    
    return {
      categories: data.categories,
      parameters: data.parameters,
      products: data.products
    };
  }

  private parseNextJsData(scriptContent: string): { categories: Category[], parameters: any, products: Record<string, Product> } {
    // Extract the JSON string from Next.js format: [1,"..."]
    const match = scriptContent.match(/\[1,"([\s\S]+)"\]/);
    
    if (!match) {
      throw new Error('Не удалось извлечь JSON строку');
    }
    
    let jsonString = match[1];
    
    // Unescape Next.js escaping
    jsonString = jsonString.replace(/\\r\\n/g, '\\n')
                          .replace(/\\"/g, '"')
                          .replace(/\\\\/g, '\\');
    
    // Extract catalog
    const categories = this.extractCatalog(jsonString);
    
    // Extract parameters
    const parameters = this.extractParameters(jsonString);
    
    // Extract products individually by pattern matching
    const products = this.extractProductsIndividually(jsonString);
    
    return { categories, parameters, products };
  }

  private extractCatalog(jsonString: string): Category[] {
    const catalogStart = jsonString.indexOf('"catalog":{');
    if (catalogStart === -1) {
      return [];
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
    const catalogStr = catalogJson.substring('"catalog":'.length);
    
    try {
      const catalog = JSON.parse(catalogStr);
      return catalog.categories || [];
    } catch (e) {
      console.error('Ошибка парсинга catalog:', e);
      return [];
    }
  }

  private extractParameters(jsonString: string): any {
    const paramsStart = jsonString.indexOf('"parameters":{');
    if (paramsStart === -1) {
      return {
        pizza: {
          diameter: {},
          dough: {},
          size: {}
        }
      };
    }
    
    // Find the end of the parameters object - it ends before "products"
    const paramsEnd = jsonString.indexOf('},"products"', paramsStart);
    if (paramsEnd === -1) {
      return {
        pizza: {
          diameter: {},
          dough: {},
          size: {}
        }
      };
    }
    
    const paramsJson = jsonString.substring(paramsStart, paramsEnd + 1);
    
    try {
      const paramsStr = paramsJson.substring('"parameters":'.length);
      return JSON.parse(paramsStr);
    } catch (e) {
      return {
        pizza: {
          diameter: {},
          dough: {},
          size: {}
        }
      };
    }
  }

  private extractProductsIndividually(jsonString: string): Record<string, Product> {
    const products: Record<string, Product> = {};
    
    // Pattern to match product data: "ID":{..."id":ID...}
    // We need to find each product object and parse it individually
    const productPattern = /"(\d+)":(\{[^{}]*"id":\d+[^{}]*\})/g;
    let match;
    
    while ((match = productPattern.exec(jsonString)) !== null) {
      const productId = match[1];
      let productJson = match[2];
      
      // Try to parse this product
      try {
        // Clean up the JSON
        productJson = productJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const product = JSON.parse(productJson);
        
        // Verify the ID matches
        if (product.id && product.id.toString() === productId) {
          products[productId] = product as Product;
        }
      } catch (e) {
        // Skip invalid products
      }
    }
    
    // If we didn't find enough products, try a more complex pattern
    // for products with nested objects
    if (Object.keys(products).length < 100) {
      return this.extractProductsComplex(jsonString);
    }
    
    return products;
  }

  private extractProductsComplex(jsonString: string): Record<string, Product> {
    const products: Record<string, Product> = {};
    
    // Find all product IDs from the catalog first
    const catalogStart = jsonString.indexOf('"catalog":{');
    if (catalogStart === -1) return products;
    
    // Extract product IDs from catalog items
    const productIdPattern = /"products":\[(\d+(?:,\d+)*)\]/g;
    const productIds = new Set<string>();
    let match;
    
    while ((match = productIdPattern.exec(jsonString)) !== null) {
      match[1].split(',').forEach(id => productIds.add(id));
    }
    
    console.log(`Найдено product ID в каталоге: ${productIds.size}`);
    
    // Now try to find each product's data
    // Pattern: "ID":{"availableAt":...,"id":ID,...}
    for (const productId of productIds) {
      // Look for the product data starting with "ID":{
      const productStart = jsonString.indexOf(`"${productId}":{`);
      if (productStart === -1) continue;
      
      // Find the end of this product object by counting braces
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let productEnd = productStart + productId.length + 3; // +3 for ":{
      
      for (let i = productEnd; i < jsonString.length; i++) {
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
              productEnd = i + 1;
              break;
            }
          }
        }
      }
      
      const productJson = jsonString.substring(productStart, productEnd);
      
      try {
        // Clean and parse
        const cleaned = productJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const product = JSON.parse(`{${cleaned.substring(cleaned.indexOf('{') + 1, cleaned.lastIndexOf('}'))}}`);
        
        if (product.id && product.id.toString() === productId) {
          products[productId] = product as Product;
        }
      } catch (e) {
        // Skip invalid
      }
    }
    
    return products;
  }
}
