import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive';
  stock: number;
  imageUrl: string;
  features: string[];
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'חבילת ייעוץ עסקי בסיסית',
    description: 'חבילת ייעוץ עסקי הכוללת 5 פגישות ייעוץ ותוכנית עסקית בסיסית',
    price: 2500,
    category: 'ייעוץ עסקי',
    status: 'active',
    stock: 999,
    imageUrl: 'https://example.com/business-consulting.jpg',
    features: ['5 פגישות ייעוץ', 'תוכנית עסקית', 'ליווי טלפוני'],
  },
  {
    id: '2',
    name: 'חבילת פיתוח אתר מתקדם',
    description: 'פיתוח אתר אינטרנט מותאם אישית כולל עיצוב ואפיון',
    price: 15000,
    category: 'פיתוח תוכנה',
    status: 'active',
    stock: 999,
    imageUrl: 'https://example.com/web-development.jpg',
    features: ['עיצוב מותאם אישית', 'ממשק ניהול', 'אבטחת מידע', 'תמיכה טכנית'],
  },
  {
    id: '3',
    name: 'חבילת שיווק דיגיטלי פרימיום',
    description: 'חבילת שיווק דיגיטלי מקיפה הכוללת קידום ברשתות חברתיות וגוגל',
    price: 7500,
    category: 'שיווק דיגיטלי',
    status: 'active',
    stock: 999,
    imageUrl: 'https://example.com/digital-marketing.jpg',
    features: ['קידום ממומן', 'ניהול רשתות חברתיות', 'אופטימיזציה לגוגל'],
  },
];

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products] = useState<Product[]>(mockProducts);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((product) => product.category)));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="חיפוש מוצרים"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
        <FormControl sx={{ width: 200 }}>
          <InputLabel>קטגוריה</InputLabel>
          <Select
            value={categoryFilter}
            label="קטגוריה"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">הכל</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={product.imageUrl}
                alt={product.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {product.features.map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  ₪{product.price.toLocaleString()}
                </Typography>
                <Button variant="contained" color="primary" fullWidth>
                  הוסף להצעת מחיר
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Products;
