import { Parser } from "./parser.js";
import { MenuParser } from "./menuParser.js";
import { saveToJson } from "./utils.js";
import { ParsedMenuData } from "./types.js";

async function main() {
  const parser = new Parser({
    baseUrl: "https://pizzafabrika.ru/vologda",
    headless: false,
  });

  try {
    await parser.launch();

    console.log('Запуск парсера меню...');
    
    // Parse menu data
    const menuParser = new MenuParser(parser.getPage());
    const menuData = await menuParser.parseMenu();
    
    console.log(`\n========== РЕЗУЛЬТАТЫ ==========`);
    console.log(`Спаршено категорий: ${menuData.categories.length}`);
    
    let totalItems = 0;
    menuData.categories.forEach(cat => {
      totalItems += cat.items.length;
    });
    console.log(`Всего элементов в категориях: ${totalItems}`);
    
    const productCount = Object.keys(menuData.products).length;
    console.log(`Спаршено продуктов: ${productCount}`);
    
    // Check parameters
    const params = menuData.parameters;
    console.log(`Параметры:`);
    console.log(`  - diameter: ${Object.keys(params?.pizza?.diameter || {}).length} значений`);
    console.log(`  - dough: ${Object.keys(params?.pizza?.dough || {}).length} значений`);
    console.log(`  - size: ${Object.keys(params?.pizza?.size || {}).length} значений`);
    
    console.log(`===============================\n`);
    
    // Save to JSON
    saveToJson(menuData, 'menu.json');
    
    console.log('Данные сохранены в menu.json');
    
  } catch (error) {
    console.error("Ошибка при парсинге:", error);
  } finally {
    await parser.close();
  }
}

main();
