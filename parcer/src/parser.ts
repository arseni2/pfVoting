import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { ParsedData, ParserConfig } from './types.js';

export class Parser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: ParserConfig;

  constructor(config: ParserConfig) {
    this.config = {
      headless: true,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      ...config
    };
  }

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout ?? 30000);

    console.log('Браузер запущен');
  }

  async close(): Promise<void> {
    await this.browser?.close();
    console.log('Браузер закрыт');
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Браузер не инициализирован. Вызовите launch()');
    }

    await this.page.goto(url);
    console.log(`Переход на страницу: ${url}`);
  }

  async parse<T extends ParsedData>(parseFn: (page: Page) => Promise<T[]>): Promise<T[]> {
    if (!this.page) {
      throw new Error('Браузер не инициализирован. Вызовите launch()');
    }

    const data = await parseFn(this.page);
    console.log(`Спаршено элементов: ${data.length}`);
    return data;
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Браузер не инициализирован. Вызовите launch()');
    }
    return this.page;
  }
}
