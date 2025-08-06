export interface Article {
  _id: string;
  title: string;
  body: string; // Made required again since body is necessary
  category: string;
  image: string;
  createdAt: string;
  // Computed properties
  date?: string;
}

export interface FilterOptions {
  category: string;
  dateRange: string;
}

export interface ArticlesPageProps {
  onArticleClick: (article: Article) => void;
}

export interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export interface ArticleDetailPageProps {
  article: Article;
  onBack: () => void;
}

export interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}