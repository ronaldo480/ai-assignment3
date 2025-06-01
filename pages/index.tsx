'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Trash2, Search, Edit } from 'lucide-react';
import html2canvas from 'html2canvas';
import Link from 'next/link';

interface ClothingItem {
  id: number;
  image: string;
  date: string;
  type?: string; // 의류 종류
  season?: string; // 계절
  color?: string; // 색상
  memo?: string; // 개인 메모
  position?: { x: number; y: number }; // 코디 영역 내 위치
}

interface StyleBookItem {
  items: ClothingItem[];
  name: string;
  description: string;
  date: string;
  likes: number;
  comments: string[];
  tags?: string[];
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
}

// AI 추천을 위한 타입 정의
interface OutfitRecommendation {
  top?: ClothingItem;
  bottom?: ClothingItem;
  outer?: ClothingItem;
  shoes?: ClothingItem;
  accessories?: ClothingItem[];
}

export default function Home() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [coordinateItems, setCoordinateItems] = useState<ClothingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [itemDetails, setItemDetails] = useState<Partial<ClothingItem>>({});
  const [selectedCoordinateItem, setSelectedCoordinateItem] = useState<{ id: number, x: number, y: number } | null>(null);
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof OutfitRecommendation | null>(null);
  const [showStyleBook, setShowStyleBook] = useState(false);
  const [styleBookItems, setStyleBookItems] = useState<StyleBookItem[]>([]);
  const [showTrends, setShowTrends] = useState(false);
  const [styleBookName, setStyleBookName] = useState('');
  const [styleBookDescription, setStyleBookDescription] = useState('');
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string[] }>({});
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [styleAnalysis, setStyleAnalysis] = useState<{
    topColors: { [key: string]: number };
    bottomColors: { [key: string]: number };
    styles: { [key: string]: number };
  }>({ topColors: {}, bottomColors: {}, styles: {} });

  useEffect(() => {
    const savedItems = localStorage.getItem('fashionCloset');
    if (savedItems) {
      setClothingItems(JSON.parse(savedItems));
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}의 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const currentSeason = getCurrentSeason();
      const filePromises = validFiles.map((file) => {
        if (!file.type.startsWith('image/')) {
          return Promise.reject(new Error(`Invalid file type: ${file.type}`));
        }

        return new Promise<ClothingItem>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const newItem: ClothingItem = {
              id: Date.now() + Math.random(),
              image: e.target?.result as string,
              date: new Date().toISOString(),
              type: '',
              season: currentSeason,
              color: '',
              memo: '',
            };
            resolve(newItem);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      });

      const newItems = await Promise.all(filePromises);

      setClothingItems((prev) => {
        const updated = [...prev, ...newItems];
        localStorage.setItem('fashionCloset', JSON.stringify(updated));
        return updated;
      });

      if (newItems.length > 0) {
        setSelectedItem(newItems[0]);
        setItemDetails(newItems[0]);
        setIsDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = (id: number) => {
    setClothingItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('fashionCloset', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const item = JSON.parse(e.dataTransfer.getData('text/plain')) as ClothingItem;
    setCoordinateItems((prev) => [...prev, item]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Optional: remove drag-over styles if implemented
  };

  const handleDownload = async () => {
    const coordinateArea = document.getElementById('coordinate-area');
    if (!coordinateArea) return;

    try {
      const canvas = await html2canvas(coordinateArea);
      const link = document.createElement('a');
      link.download = 'my-coordinate.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to download coordinate:', error);
    }
  };

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setItemDetails(item);
    setIsDetailsDialogOpen(true);
  };

  const handleDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setItemDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = () => {
    if (!selectedItem) return;

    setClothingItems(prev => {
      const updatedItems = prev.map(item =>
        item.id === selectedItem.id ? { ...item, ...itemDetails as ClothingItem } : item
      );
      localStorage.setItem('fashionCloset', JSON.stringify(updatedItems));
      return updatedItems;
    });

    setIsDetailsDialogOpen(false);
    setSelectedItem(null);
    setItemDetails({});
  };

  const filteredClothingItems = useMemo(() => {
    if (!searchTerm) {
      return clothingItems;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return clothingItems.filter(item => {
      if (item.image.toLowerCase().includes(lowerCaseSearchTerm)) {
        return true;
      }
      if (item.type?.toLowerCase().includes(lowerCaseSearchTerm)) return true;
      if (item.season?.toLowerCase().includes(lowerCaseSearchTerm)) return true;
      if (item.color?.toLowerCase().includes(lowerCaseSearchTerm)) return true;
      if (item.memo?.toLowerCase().includes(lowerCaseSearchTerm)) return true;

      return false;
    });
  }, [clothingItems, searchTerm]);

  const handleCoordinateItemClick = (e: React.MouseEvent, item: ClothingItem) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedCoordinateItem({ id: item.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCoordinateItemDragStart = (e: React.DragEvent, item: ClothingItem) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ...item,
      offsetX,
      offsetY
    }));
  };

  const handleCoordinateItemDragEnd = (e: React.DragEvent) => {
    setSelectedCoordinateItem(null);
  };

  const handleCoordinateAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const coordinateAreaElement = document.getElementById('coordinate-area');
    if (!coordinateAreaElement) {
      console.error("Coordinate area element not found.");
      return;
    }

    try {
      const itemData = e.dataTransfer.getData('text/plain');
      const draggedData = JSON.parse(itemData);
      const coordinateAreaRect = coordinateAreaElement.getBoundingClientRect();

      // 새로운 아이템 추가 (옷장에서 드래그)
      if (clothingItems.some(item => item.id === draggedData.id)) {
        const newPosition = {
          x: e.clientX - coordinateAreaRect.left - 48,
          y: e.clientY - coordinateAreaRect.top - 48
        };
        const newItem = {
          ...draggedData,
          id: Date.now(),
          position: newPosition
        };
        setCoordinateItems((prev) => [...prev, newItem]);
      }
      // 기존 아이템 이동 (코디 영역 내에서 드래그)
      else if (coordinateItems.some(item => item.id === draggedData.id)) {
        const newX = e.clientX - coordinateAreaRect.left - draggedData.offsetX;
        const newY = e.clientY - coordinateAreaRect.top - draggedData.offsetY;

        setCoordinateItems(prev =>
          prev.map(item =>
            item.id === draggedData.id ? { ...item, position: { x: newX, y: newY } } : item
          )
        );
      }
    } catch (error) {
      console.error("Error handling coordinate area drop:", error);
    }
  };

  const handleDeleteCoordinateItem = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    setCoordinateItems(prev => prev.filter(item => item.id !== itemId));
  };

  // AI 코디 추천 로직
  const generateOutfitRecommendation = () => {
    setIsRecommending(true);

    try {
      const currentSeason = getCurrentSeason();
      console.log('Current season:', currentSeason);

      const seasonalItems = clothingItems.filter(item => {
        const itemSeason = item.season?.toLowerCase() || '';
        return itemSeason.includes(currentSeason.toLowerCase()) ||
          itemSeason.includes('사계절') ||
          !itemSeason;
      });

      console.log('Total items:', clothingItems.length);
      console.log('Seasonal items:', seasonalItems.length);

      if (seasonalItems.length === 0) {
        alert('현재 계절에 맞는 옷이 없습니다. 옷장에 옷을 추가해주세요.');
        setIsRecommending(false);
        return;
      }

      // 상의와 하의를 함께 선택
      const tops = seasonalItems.filter(item => {
        const type = item.type?.toLowerCase() || '';
        return type.includes('티셔츠') || type.includes('반팔티') || type.includes('긴팔티') ||
          type.includes('니트') || type.includes('후드티') || type.includes('셔츠') || type.includes('블라우스');
      });

      const bottoms = seasonalItems.filter(item => {
        const type = item.type?.toLowerCase() || '';
        return type.includes('청바지') || type.includes('슬랙스') || type.includes('반바지') ||
          type.includes('치마') || type.includes('레깅스');
      });

      const outers = seasonalItems.filter(item => {
        const type = item.type?.toLowerCase() || '';
        return type.includes('자켓') || type.includes('코트') || type.includes('패딩') ||
          type.includes('가디건') || type.includes('후드집업');
      });

      const shoes = seasonalItems.filter(item => {
        const type = item.type?.toLowerCase() || '';
        return type.includes('운동화') || type.includes('구두') || type.includes('샌들') ||
          type.includes('슬리퍼') || type.includes('부츠');
      });

      console.log('Filtered items:', {
        tops: tops.length,
        bottoms: bottoms.length,
        outers: outers.length,
        shoes: shoes.length
      });

      if (tops.length === 0 && bottoms.length === 0 && outers.length === 0 && shoes.length === 0) {
        alert('추천할 수 있는 옷이 없습니다. 옷장에 옷을 추가해주세요.');
        setIsRecommending(false);
        return;
      }

      // 상의와 하의를 함께 선택
      const selectedTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : undefined;
      const selectedBottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : undefined;

      const recommendation: OutfitRecommendation = {
        top: selectedTop,
        bottom: selectedBottom,
        outer: outers.length > 0 ? outers[Math.floor(Math.random() * outers.length)] : undefined,
        shoes: shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : undefined
      };

      if (!recommendation.top && !recommendation.bottom && !recommendation.outer && !recommendation.shoes) {
        alert('추천할 수 있는 옷이 없습니다. 옷장에 옷을 추가해주세요.');
        setIsRecommending(false);
        return;
      }

      setRecommendation(recommendation);
    } catch (error) {
      console.error('Error generating outfit recommendation:', error);
      alert('코디 추천 중 오류가 발생했습니다.');
    } finally {
      setIsRecommending(false);
    }
  };

  // 현재 계절 반환 함수
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '봄';
    if (month >= 6 && month <= 8) return '여름';
    if (month >= 9 && month <= 11) return '가을';
    return '겨울';
  };

  // 추천된 코디 적용 함수
  const applyRecommendation = () => {
    if (!recommendation) return;

    try {
      const newItems: ClothingItem[] = [];
      let xOffset = 0;

      // 추천된 아이템들을 순서대로 배치
      if (recommendation.top) {
        newItems.push({
          ...recommendation.top,
          id: Date.now() + 1,
          position: { x: xOffset, y: 0 }
        });
        xOffset += 120;
      }
      if (recommendation.bottom) {
        newItems.push({
          ...recommendation.bottom,
          id: Date.now() + 2,
          position: { x: xOffset, y: 0 }
        });
        xOffset += 120;
      }
      if (recommendation.outer) {
        newItems.push({
          ...recommendation.outer,
          id: Date.now() + 3,
          position: { x: xOffset, y: 0 }
        });
        xOffset += 120;
      }
      if (recommendation.shoes) {
        newItems.push({
          ...recommendation.shoes,
          id: Date.now() + 4,
          position: { x: xOffset, y: 0 }
        });
      }

      setCoordinateItems(newItems);
    } catch (error) {
      console.error('Error applying recommendation:', error);
      alert('코디 적용 중 오류가 발생했습니다.');
    }
  };

  // 추천 아이템 변경 함수
  const changeRecommendedItem = (category: keyof OutfitRecommendation) => {
    if (!recommendation) return;

    try {
      const currentSeason = getCurrentSeason();
      const seasonalItems = clothingItems.filter(item => {
        const itemSeason = item.season?.toLowerCase() || '';
        return itemSeason.includes(currentSeason.toLowerCase()) ||
          itemSeason.includes('사계절') ||
          !itemSeason;
      });

      // 상의 변경 시 하의도 함께 변경
      if (category === 'top') {
        const topItems = seasonalItems.filter(item => {
          const type = item.type?.toLowerCase() || '';
          return type.includes('티셔츠') || type.includes('반팔티') || type.includes('긴팔티') ||
            type.includes('니트') || type.includes('후드티') || type.includes('셔츠') || type.includes('블라우스');
        });

        const bottomItems = seasonalItems.filter(item => {
          const type = item.type?.toLowerCase() || '';
          return type.includes('청바지') || type.includes('슬랙스') || type.includes('반바지') ||
            type.includes('치마') || type.includes('레깅스') || type.includes('트레이닝복') ||
            type.includes('조거팬츠') || type.includes('와이드팬츠') || type.includes('슬림팬츠') ||
            type.includes('스키니팬츠') || type.includes('숏팬츠') || type.includes('미니스커트') ||
            type.includes('미디스커트') || type.includes('롱스커트') || type.includes('플리츠스커트') ||
            type.includes('니트스커트');
        });

        if (topItems.length === 0 || bottomItems.length === 0) {
          alert('상의나 하의가 부족합니다.');
          return;
        }

        // 현재 선택된 상의 제외
        const currentTop = recommendation.top;
        const otherTops = topItems.filter(item => !currentTop || item.id !== currentTop.id);
        const newTop = otherTops[Math.floor(Math.random() * otherTops.length)];

        // 현재 선택된 하의 제외
        const currentBottom = recommendation.bottom;
        const otherBottoms = bottomItems.filter(item => !currentBottom || item.id !== currentBottom.id);
        const newBottom = otherBottoms[Math.floor(Math.random() * otherBottoms.length)];

        setRecommendation(prev => ({
          ...prev!,
          top: newTop,
          bottom: newBottom
        }));
        return;
      }

      // 다른 카테고리 변경
      let categoryItems: ClothingItem[] = [];
      switch (category) {
        case 'bottom':
          categoryItems = seasonalItems.filter(item => {
            const type = item.type?.toLowerCase() || '';
            return type.includes('청바지') || type.includes('슬랙스') || type.includes('반바지') ||
              type.includes('치마') || type.includes('레깅스') || type.includes('트레이닝복') ||
              type.includes('조거팬츠') || type.includes('와이드팬츠') || type.includes('슬림팬츠') ||
              type.includes('스키니팬츠') || type.includes('숏팬츠') || type.includes('미니스커트') ||
              type.includes('미디스커트') || type.includes('롱스커트') || type.includes('플리츠스커트') ||
              type.includes('니트스커트');
          });
          break;
        case 'outer':
          categoryItems = seasonalItems.filter(item => {
            const type = item.type?.toLowerCase() || '';
            return type.includes('자켓') || type.includes('코트') || type.includes('패딩') ||
              type.includes('가디건') || type.includes('후드집업');
          });
          break;
        case 'shoes':
          categoryItems = seasonalItems.filter(item => {
            const type = item.type?.toLowerCase() || '';
            return type.includes('운동화') || type.includes('구두') || type.includes('샌들') ||
              type.includes('슬리퍼') || type.includes('부츠');
          });
          break;
      }

      if (categoryItems.length === 0) {
        alert('해당 카테고리의 다른 옷이 없습니다.');
        return;
      }

      const currentItem = recommendation[category];
      if (currentItem && 'id' in currentItem) {
        const otherItems = categoryItems.filter(item => item.id !== currentItem.id);
        const newItem = otherItems[Math.floor(Math.random() * otherItems.length)];

        setRecommendation(prev => ({
          ...prev!,
          [category]: newItem
        }));
      }
    } catch (error) {
      console.error('Error changing recommended item:', error);
      alert('아이템 변경 중 오류가 발생했습니다.');
    }
  };

  // 스타일 북에 코디 저장
  const saveToStyleBook = () => {
    if (coordinateItems.length === 0) {
      alert('저장할 코디가 없습니다.');
      return;
    }

    if (!styleBookName.trim()) {
      alert('스타일 이름을 입력해주세요.');
      return;
    }

    const newStyleBookItem: StyleBookItem = {
      items: [...coordinateItems],
      name: styleBookName.trim(),
      description: styleBookDescription.trim(),
      date: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    setStyleBookItems(prev => [...prev, newStyleBookItem]);
    setStyleBookName('');
    setStyleBookDescription('');
    alert('스타일 북에 저장되었습니다!');
  };

  // 스타일 북에서 코디 불러오기
  const loadFromStyleBook = (items: ClothingItem[]) => {
    setCoordinateItems(items.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      position: { x: 0, y: 0 }
    })));
  };

  // 좋아요 기능
  const handleLike = (styleIndex: number) => {
    setLikes(prev => ({
      ...prev,
      [styleIndex]: (prev[styleIndex] || 0) + 1
    }));
  };

  // 댓글 추가 기능
  const handleAddComment = (styleIndex: number, comment: string) => {
    setComments(prev => ({
      ...prev,
      [styleIndex]: [...(prev[styleIndex] || []), comment]
    }));
  };

  // 날씨 정보 가져오기
  const fetchWeatherInfo = async () => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!API_KEY) {
        throw new Error('OpenWeather API 키가 설정되지 않았습니다.');
      }

      let latitude = 37.5665;  // 서울 위도
      let longitude = 126.9780;  // 서울 경도

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.log('위치 정보를 가져올 수 없어 서울의 날씨를 표시합니다.');
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
      );

      if (!response.ok) {
        throw new Error('날씨 정보를 가져오는데 실패했습니다.');
      }

      const data = await response.json();

      if (data && data.main) {
        setWeatherInfo({
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          humidity: data.main.humidity
        });
      } else {
        throw new Error('날씨 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('날씨 정보를 가져오는데 실패했습니다:', error);
      setWeatherInfo({
        temperature: 20,
        condition: '날씨 정보를 가져올 수 없습니다',
        humidity: 60
      });
    }
  };

  // 스타일 분석
  const analyzeStyle = () => {
    const analysis = {
      topColors: {} as { [key: string]: number },
      bottomColors: {} as { [key: string]: number },
      styles: {} as { [key: string]: number }
    };

    clothingItems.forEach(item => {
      if (item.color) {
        if (item.type?.includes('티셔츠') || item.type?.includes('셔츠') || item.type?.includes('니트')) {
          analysis.topColors[item.color] = (analysis.topColors[item.color] || 0) + 1;
        } else if (item.type?.includes('바지') || item.type?.includes('치마')) {
          analysis.bottomColors[item.color] = (analysis.bottomColors[item.color] || 0) + 1;
        }
      }
      if (item.type) {
        analysis.styles[item.type] = (analysis.styles[item.type] || 0) + 1;
      }
    });

    setStyleAnalysis(analysis);
  };

  // 날씨 기반 추천
  const getWeatherBasedRecommendation = () => {
    if (!weatherInfo) return null;

    const temp = weatherInfo.temperature;
    let season = '';
    let recommendation = '';

    if (temp >= 25) {
      season = '여름';
      recommendation = '가볍고 시원한 옷을 추천해드립니다. 반팔티, 반바지, 민소매 등 시원한 옷차림이 좋습니다.';
    } else if (temp >= 15) {
      season = '봄';
      recommendation = '가벼운 겉옷과 함께 입기 좋은 옷을 추천해드립니다. 니트나 가디건을 챙기시면 좋습니다.';
    } else if (temp >= 5) {
      season = '가을';
      recommendation = '보온성이 좋은 옷을 추천해드립니다. 두꺼운 니트나 자켓을 챙기시면 좋습니다.';
    } else {
      season = '겨울';
      recommendation = '두꺼운 겉옷과 함께 입기 좋은 옷을 추천해드립니다. 패딩이나 코트를 챙기시면 좋습니다.';
    }

    return {
      season,
      recommendation: `현재 기온 ${temp}°C, ${weatherInfo.condition} 상태입니다. 
        ${season}에 어울리는 ${recommendation}`
    };
  };

  useEffect(() => {
    fetchWeatherInfo();
    analyzeStyle();
    // 30분마다 날씨 정보 업데이트
    const weatherInterval = setInterval(fetchWeatherInfo, 30 * 60 * 1000);

    return () => {
      clearInterval(weatherInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">FASHION CLOSET</h1>
          <nav>
            <ul className="flex space-x-8">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">HOME</Link></li>
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">ABOUT</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">CONTACT</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {!showApp ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">나만의 패션 옷장</h2>
          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            본 제품은 사용자가 소유한 의류 사진을 업로드하고 체계적으로 관리하며 개인 맞춤형 패션 코디를 쉽게 구성하고 저장할 수 있는 웹사이트이다.
            사용자는 웹사이트를 통해 자신의 옷을 효율적으로 관리하고 다양한 스타일링 아이디어를 얻을 수 있으며,
            사용자가 원하는 정보를 손쉽게 추가하고 확인할 수 있도록 직관적인 인터페이스를 제공한다.
          </p>
          <Button
            size="lg"
            onClick={() => setShowApp(true)}
            className="px-12 py-6 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition-all transform hover:scale-105"
          >
            시작하기
          </Button>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Closet Section */}
            <section className="bg-gray-900 rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">내 옷장</h2>
                {weatherInfo && (
                  <div className="text-sm text-gray-300">
                    현재 기온: {weatherInfo.temperature}°C
                  </div>
                )}
              </div>

              {/* 스타일 분석 섹션 */}
              <div className="mb-6 p-4 bg-gray-800 rounded-xl">
                <h3 className="text-lg font-semibold mb-3">스타일 분석</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">상의 색상</h4>
                    <div className="space-y-1">
                      {Object.entries(styleAnalysis.topColors)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([color, count]) => (
                          <div key={color} className="text-sm text-gray-300">
                            {color}: {count}개
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">하의 색상</h4>
                    <div className="space-y-1">
                      {Object.entries(styleAnalysis.bottomColors)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([color, count]) => (
                          <div key={color} className="text-sm text-gray-300">
                            {color}: {count}개
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="옷 검색..."
                  className="pl-12 pr-4 py-3 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  옷 사진 업로드
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredClothingItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group aspect-square cursor-pointer bg-gray-800 rounded-xl overflow-hidden"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={item.image}
                      alt="Clothing item"
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                        className="absolute top-2 left-2 p-2 bg-purple-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="상세 정보 편집"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="옷 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coordinate Section */}
            <section className="bg-gray-900 rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">오늘의 코디</h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setShowTrends(!showTrends)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
                  >
                    {showTrends ? '트렌드 닫기' : '패션 트렌드'}
                  </Button>
                  <Button
                    onClick={generateOutfitRecommendation}
                    disabled={isRecommending || clothingItems.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isRecommending ? '추천 중...' : 'AI 코디 추천'}
                  </Button>
                  {recommendation && (
                    <Button
                      onClick={applyRecommendation}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
                    >
                      추천 코디 적용
                    </Button>
                  )}
                  {coordinateItems.length > 0 && (
                    <Button
                      onClick={saveToStyleBook}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
                    >
                      스타일 북에 저장
                    </Button>
                  )}
                </div>
              </div>

              {/* 날씨 기반 추천 */}
              {weatherInfo && (
                <div className="mb-6 p-4 bg-gray-800 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2">날씨 기반 추천</h3>
                  <p className="text-sm text-gray-300">
                    {getWeatherBasedRecommendation()?.recommendation}
                  </p>
                </div>
              )}

              {/* 패션 트렌드 섹션 */}
              {showTrends && (
                <div className="mb-6 p-6 bg-gray-800 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">현재 트렌드</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">봄/여름 트렌드</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>• 오버사이즈 티셔츠</li>
                        <li>• 와이드 팬츠</li>
                        <li>• 크롭 자켓</li>
                        <li>• 스니커즈</li>
                      </ul>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">인기 스타일</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>• 미니멀 룩</li>
                        <li>• 스트릿 캐주얼</li>
                        <li>• 아카이브 스타일</li>
                        <li>• 유니섹스 룩</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {recommendation && (
                <div className="mb-6 p-6 bg-gray-800 rounded-xl">
                  <h3 className="font-bold mb-4 text-white">추천된 코디</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {recommendation.top && (
                      <div
                        className="cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        onClick={() => changeRecommendedItem('top')}
                      >
                        <span className="text-gray-400">상의:</span> {recommendation.top.type}
                      </div>
                    )}
                    {recommendation.bottom && (
                      <div
                        className="cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        onClick={() => changeRecommendedItem('bottom')}
                      >
                        <span className="text-gray-400">하의:</span> {recommendation.bottom.type}
                      </div>
                    )}
                    {recommendation.outer && (
                      <div
                        className="cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        onClick={() => changeRecommendedItem('outer')}
                      >
                        <span className="text-gray-400">아우터:</span> {recommendation.outer.type}
                      </div>
                    )}
                    {recommendation.shoes && (
                      <div
                        className="cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        onClick={() => changeRecommendedItem('shoes')}
                      >
                        <span className="text-gray-400">신발:</span> {recommendation.shoes.type}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">* 아이템을 클릭하면 다른 옵션으로 변경됩니다</p>
                </div>
              )}

              <div
                id="coordinate-area"
                className={`min-h-[400px] border-2 border-dashed rounded-xl p-6 overflow-auto relative ${isDragging ? 'border-purple-500 bg-gray-800' : 'border-gray-700 bg-gray-800'
                  }`}
                onDrop={handleCoordinateAreaDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {coordinateItems.map((item) => (
                  <div
                    key={item.id}
                    className="coordinate-item absolute group"
                    style={{
                      left: item.position?.x || 0,
                      top: item.position?.y || 0,
                      width: '120px',
                      height: '120px',
                      cursor: 'move'
                    }}
                    draggable
                    onDragStart={(e) => handleCoordinateItemDragStart(e, item)}
                    onDragEnd={handleCoordinateItemDragEnd}
                    onClick={(e) => handleCoordinateItemClick(e, item)}
                  >
                    <img
                      src={item.image}
                      alt="Coordinate item"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                    <button
                      onClick={(e) => handleDeleteCoordinateItem(e, item.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="코디에서 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {coordinateItems.length === 0 && (
                  <p className="text-center text-gray-500">여기에 옷을 드래그하여 코디를 만들어보세요.</p>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <Button
                  onClick={() => setShowStyleBook(!showStyleBook)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
                >
                  {showStyleBook ? '스타일 북 닫기' : '스타일 북 보기'}
                </Button>

                {/* 스타일 북 저장 폼 */}
                {coordinateItems.length > 0 && showStyleBook && (
                  <div className="bg-gray-800 rounded-xl p-4">
                    <h3 className="text-lg font-semibold mb-4">스타일 북에 저장</h3>
                    <div className="space-y-4">
                      <Input
                        placeholder="스타일 이름"
                        value={styleBookName}
                        onChange={(e) => setStyleBookName(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Textarea
                        placeholder="스타일 설명"
                        value={styleBookDescription}
                        onChange={(e) => setStyleBookDescription(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* 스타일 북 표시 */}
                {showStyleBook && (
                  <div className="bg-gray-800 rounded-xl p-4">
                    <h3 className="text-lg font-semibold mb-4">저장된 스타일</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {styleBookItems.map((items, index) => (
                        <div
                          key={index}
                          className="bg-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{items.name || `스타일 ${index + 1}`}</h4>
                              <p className="text-sm text-gray-400">{items.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleLike(index)}
                                className="p-2 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
                              >
                                ❤️ {likes[index] || 0}
                              </button>
                              <button
                                onClick={() => loadFromStyleBook(items.items)}
                                className="p-2 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
                              >
                                적용
                              </button>
                            </div>
                          </div>
                          <div className="flex space-x-2 mb-3">
                            {items.items.map((item, itemIndex) => (
                              <img
                                key={itemIndex}
                                src={item.image}
                                alt={`Style ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ))}
                          </div>
                          {/* 댓글 섹션 */}
                          <div className="mt-3">
                            <div className="space-y-2">
                              {(comments[index] || []).map((comment, commentIndex) => (
                                <div key={commentIndex} className="text-sm text-gray-300 bg-gray-600 p-2 rounded">
                                  {comment}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex space-x-2">
                              <Input
                                placeholder="댓글 작성..."
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    handleAddComment(index, input.value);
                                    input.value = '';
                                  }
                                }}
                                className="flex-1 bg-gray-600 border-gray-500 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleDownload}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  disabled={coordinateItems.length === 0}
                >
                  <Download className="w-5 h-5 mr-2" />
                  코디 이미지 다운로드
                </Button>
              </div>
            </section>
          </div>
        </main>
      )}

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">옷 상세 정보</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {selectedItem?.image && (
              <div className="flex justify-center">
                <img src={selectedItem.image} alt="Selected clothing item" className="max-h-48 rounded-xl" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-gray-300">의류 종류</Label>
              <select
                id="type"
                name="type"
                value={itemDetails.type || ''}
                onChange={handleDetailsChange}
                className="col-span-3 flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">의류 종류 선택</option>
                <optgroup label="상의">
                  <option value="티셔츠">티셔츠</option>
                  <option value="반팔티">반팔티</option>
                  <option value="긴팔티">긴팔티</option>
                  <option value="니트">니트</option>
                  <option value="후드티">후드티</option>
                  <option value="셔츠">셔츠</option>
                  <option value="블라우스">블라우스</option>
                </optgroup>
                <optgroup label="하의">
                  <option value="청바지">청바지</option>
                  <option value="슬랙스">슬랙스</option>
                  <option value="반바지">반바지</option>
                  <option value="치마">치마</option>
                  <option value="레깅스">레깅스</option>
                  <option value="트레이닝복">트레이닝복</option>
                  <option value="조거팬츠">조거팬츠</option>
                  <option value="와이드팬츠">와이드팬츠</option>
                  <option value="슬림팬츠">슬림팬츠</option>
                  <option value="스키니팬츠">스키니팬츠</option>
                  <option value="숏팬츠">숏팬츠</option>
                  <option value="미니스커트">미니스커트</option>
                  <option value="미디스커트">미디스커트</option>
                  <option value="롱스커트">롱스커트</option>
                  <option value="플리츠스커트">플리츠스커트</option>
                  <option value="니트스커트">니트스커트</option>
                </optgroup>
                <optgroup label="아우터">
                  <option value="자켓">자켓</option>
                  <option value="코트">코트</option>
                  <option value="패딩">패딩</option>
                  <option value="가디건">가디건</option>
                  <option value="후드집업">후드집업</option>
                </optgroup>
                <optgroup label="신발">
                  <option value="운동화">운동화</option>
                  <option value="구두">구두</option>
                  <option value="샌들">샌들</option>
                  <option value="슬리퍼">슬리퍼</option>
                  <option value="부츠">부츠</option>
                </optgroup>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="season" className="text-right text-gray-300">계절</Label>
              <select
                id="season"
                name="season"
                value={itemDetails.season || ''}
                onChange={handleDetailsChange}
                className="col-span-3 flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">계절 선택</option>
                <option value="봄">봄</option>
                <option value="여름">여름</option>
                <option value="가을">가을</option>
                <option value="겨울">겨울</option>
                <option value="사계절">사계절</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right text-gray-300">색상</Label>
              <Input
                id="color"
                name="color"
                value={itemDetails.color || ''}
                onChange={handleDetailsChange}
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memo" className="text-right text-gray-300">메모</Label>
              <Textarea
                id="memo"
                name="memo"
                value={itemDetails.memo || ''}
                onChange={handleDetailsChange}
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveDetails}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
