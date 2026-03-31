export interface ProductOption {
  categoryId: number;
  itemIds: number[];
  logic: string;
  totalMaxAvailable: number;
}

export interface Product {
  availableAt: string | null;
  badges: string[];
  bonusRateForSubscriber: number | null;
  caption: string;
  categoryId: number;
  combo: {
    combogroups: Array<{
      combogroupId: number;
      items: number[];
      parentCombogroupId: number | null;
      required: boolean;
      title: string;
    }>;
    prices: Record<string, string>;
  } | null;
  commonBonusRate: number | null;
  constructor: {
    basePic: string;
    categories: Array<{
      categoryId: number;
      items: Array<{
        count: number;
        isDefault: boolean;
        isRequired: boolean;
        itemId: number;
        place: string;
        quantityImages: Record<string, string>;
        tinyImage: string;
      }>;
      maxItems: number;
      minItems: number;
      title: string;
    }>;
    fieldHeight: number;
    fieldWidth: number;
    innerPositionLeft: number;
    innerPositionTop: number;
    innerSize: number;
    maxWeight: number;
    minPrice: string;
  } | null;
  constructorType: string;
  description: string;
  editable?: boolean;
  id: number;
  image: string;
  keywords: string[];
  metaDescription: string;
  nutrients: {
    calories: string;
    carbs: string;
    fats: string;
    joules: string;
    proteins: string;
  };
  oldPrice: string | null;
  options: {
    additions: ProductOption[];
    removableIngredients: number[];
  };
  parameters: {
    pizza?: {
      diameter?: string;
      dough?: string;
      size?: string;
    };
    option?: {
      maxAvailable: number;
      selectedByDefault: boolean;
      skipWeightCalculation: boolean;
    };
  } | null;
  price: string;
  products?: number[];
  shortTitle: string;
  stopped: boolean;
  title: string;
  weight: number;
}

export interface CategoryItem {
  availableAt: string | null;
  description: string;
  editable?: boolean;
  products: number[];
  stopped: boolean;
  title: string;
}

export interface Category {
  availableAt: string | null;
  caption: string;
  id: number;
  image: string;
  items: CategoryItem[];
  stopped: boolean;
  title: string;
}

export interface ParsedMenuData {
  categories: Category[];
  parameters: {
    pizza: {
      diameter: Record<string, { unit: string; value: number }>;
      dough: Record<string, string>;
      size: Record<string, string>;
    };
  };
  products: Record<string, Product>;
}

export interface ParsedData {
  id?: string | number;
  title?: string;
  description?: string;
  price?: string | number;
  url?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface ParserConfig {
  baseUrl: string;
  headless?: boolean;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
}
