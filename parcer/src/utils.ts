import { writeFileSync } from 'fs';
import { ParsedData, ParsedMenuData } from './types.js';

export function saveToJson(data: ParsedData[] | ParsedMenuData, filename: string = 'output.json'): void {
  writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Данные сохранены в ${filename}`);
}