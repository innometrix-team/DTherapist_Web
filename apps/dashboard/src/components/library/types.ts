export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  author: string;
  image: string;
  readTime: string;
}

export interface FilterOptions {
  category: string;
  dateRange: string;
  author: string;
}

export interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export interface ArticlesPageProps {
  onArticleClick: (article: Article) => void;
}

export interface ArticleDetailPageProps {
  article: Article;
  onBack: () => void;
}