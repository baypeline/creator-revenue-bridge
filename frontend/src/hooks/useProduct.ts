import { useQuery } from '@tanstack/react-query';
import { ProductOffchainData, ProductOnchainData, Product } from '../types/product';

// 백엔드가 완성되면 이 함수들을 실제 API Fetch 로직으로 교체하면 됩니다.

const MOCK_PRODUCTS: Product[] = [
  { id: 'demo-product-1', creatorName: '침착맨 (가상 데모)', title: '유튜브 2027년 예상 수익 선지급 상품', description: '국내 최고 유튜브 크리에이터 침착맨의 2027년도 유튜브 예상 광고/조회수 수익에 기반하여 발행되는 수익권 RWA 토큰입니다.', imageUrl: 'https://unavatar.io/youtube/@ChimChakMan_Official', expectedApy: 12.5, maturityDate: '2027-12-31T23:59:59Z', targetAmount: 10000, currentAmount: 6500, status: 'funding' },
  { id: 'demo-product-2', creatorName: '슈카월드 (가상 데모)', title: '경제/금융 채널 2026 상반기 광고 수익권', description: '대한민국 대표 경제 유튜브 채널 슈카월드의 2026년 상반기 예상 수익을 기반으로 한 안전 자산 성격의 상품입니다.', imageUrl: 'https://unavatar.io/youtube/@syukaworld', expectedApy: 8.5, maturityDate: '2026-06-30T23:59:59Z', targetAmount: 20000, currentAmount: 20000, status: 'active' },
  { id: 'demo-product-3', creatorName: '쯔양 (가상 데모)', title: '글로벌 먹방 채널 글로벌 확장 펀딩', description: '해외 구독자 비율이 급증하고 있는 쯔양 채널의 글로벌 진출 펀딩을 위한 브릿지 상품입니다.', imageUrl: 'https://unavatar.io/youtube/@tzuyang6145', expectedApy: 15.0, maturityDate: '2028-12-31T23:59:59Z', targetAmount: 50000, currentAmount: 12000, status: 'funding' },
  { id: 'demo-product-4', creatorName: '잇섭 (가상 데모)', title: '테크 리뷰 채널 2026 IT 박람회 시즌 선지급', description: '주요 IT 박람회(CES, MWC) 시즌에 발생하는 대규모 광고 수익을 미리 현금화하는 단기 정산 상품입니다.', imageUrl: 'https://unavatar.io/youtube/@ITSub', expectedApy: 10.0, maturityDate: '2026-03-31T23:59:59Z', targetAmount: 5000, currentAmount: 5000, status: 'completed' },
  { id: 'demo-product-5', creatorName: '빠니보틀 (가상 데모)', title: '글로벌 여행 콘텐츠 2026 수익권', description: '세계 여행 유튜버 빠니보틀의 2026년 해외 로케이션 영상 광고 수익 기반 선지급 상품입니다.', imageUrl: 'https://unavatar.io/youtube/@PaniBottle', expectedApy: 11.0, maturityDate: '2026-12-31T23:59:59Z', targetAmount: 30000, currentAmount: 15000, status: 'funding' },
  { id: 'demo-product-6', creatorName: '곽튜브 (가상 데모)', title: '중앙아시아 탐방 시리즈 펀딩', description: '곽튜브의 중앙아시아 심층 탐방 다큐멘터리 제작을 위한 수익권 기반 펀딩입니다.', imageUrl: 'https://unavatar.io/youtube/@GWAKTUBE', expectedApy: 9.5, maturityDate: '2026-08-31T23:59:59Z', targetAmount: 25000, currentAmount: 25000, status: 'active' },
  { id: 'demo-product-7', creatorName: '감스트 (가상 데모)', title: '2026 월드컵 시즌 아프리카/유튜브 수익', description: '월드컵 특수로 인한 폭발적인 스트리밍 수익 증가를 타겟으로 한 메가 이벤트 RWA.', imageUrl: 'https://unavatar.io/youtube/@GAMST', expectedApy: 20.0, maturityDate: '2026-08-31T23:59:59Z', targetAmount: 80000, currentAmount: 20000, status: 'funding' },
  { id: 'demo-product-8', creatorName: '우왁굳 (가상 데모)', title: '이세돌 3집 앨범 제작 연계 수익권', description: '버추얼 아이돌 이세계아이돌의 3집 앨범 스트리밍 및 굿즈 수익을 담보로 하는 RWA.', imageUrl: 'https://unavatar.io/youtube/@woowakgood', expectedApy: 18.5, maturityDate: '2027-06-30T23:59:59Z', targetAmount: 100000, currentAmount: 85000, status: 'funding' },
  { id: 'demo-product-9', creatorName: '풍월량 (가상 데모)', title: '2026년 트위치 스트리밍 후원 수익권', description: '국내 최고 게임 스트리머 풍월량의 2026년 정기구독 및 도네이션 예상 수익 상품.', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop', expectedApy: 7.5, maturityDate: '2026-12-31T23:59:59Z', targetAmount: 40000, currentAmount: 12000, status: 'funding' },
  { id: 'demo-product-10', creatorName: '엔조이커플 (가상 데모)', title: '코미디 숏폼 콘텐츠 2026년 수익', description: '폭발적인 숏폼 알고리즘 수익을 바탕으로 구성된 고수익/단기 정산 RWA 상품.', imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop', expectedApy: 16.0, maturityDate: '2026-03-31T23:59:59Z', targetAmount: 15000, currentAmount: 15000, status: 'active' },
  { id: 'demo-product-11', creatorName: '승우아빠 (가상 데모)', title: '대형 요리 프로젝트 스폰서십 연계', description: '식당 창업 다큐멘터리 제작비 조달 및 향후 브랜드 유튜브 수익 배분권.', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000&auto=format&fit=crop', expectedApy: 10.5, maturityDate: '2027-09-30T23:59:59Z', targetAmount: 35000, currentAmount: 35000, status: 'completed' },
  { id: 'demo-product-12', creatorName: '랄로 (가상 데모)', title: '2026년 상반기 유튜브 수익 채권', description: '롤/종합게임 방송인 랄로의 영상 업로드 및 광고 수익을 기반으로 한 선지급 펀딩.', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000&auto=format&fit=crop', expectedApy: 13.0, maturityDate: '2026-06-30T23:59:59Z', targetAmount: 20000, currentAmount: 8000, status: 'funding' },
  { id: 'demo-product-13', creatorName: '과공 (가상 데모)', title: '과학/지식 채널 2026년 광고 수익', description: '안정적인 조회수를 자랑하는 지식 채널의 2026년도 에드센스 수익 기반 권리.', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop', expectedApy: 6.5, maturityDate: '2026-12-31T23:59:59Z', targetAmount: 10000, currentAmount: 10000, status: 'active' },
  { id: 'demo-product-14', creatorName: '입짧은햇님 (가상 데모)', title: '푸드/먹방 채널 하반기 브랜디드 수익', description: '입짧은햇님의 하반기 대형 식품 브랜드 스폰서십 확정 수익에 대한 할인 채권.', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop', expectedApy: 8.0, maturityDate: '2025-12-31T23:59:59Z', targetAmount: 25000, currentAmount: 25000, status: 'completed' },
  { id: 'demo-product-15', creatorName: '보겸 (가상 데모)', title: '복귀 이후 2026년 1분기 수익권', description: '초대형 팬덤을 보유한 보겸 채널의 1분기 집중 영상 조회수 수익 연동 상품.', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop', expectedApy: 14.5, maturityDate: '2026-03-31T23:59:59Z', targetAmount: 45000, currentAmount: 41000, status: 'funding' },
  { id: 'demo-product-16', creatorName: '감스트 (가상 데모)', title: '2026 월드컵 시즌 아프리카/유튜브 수익', description: '월드컵 특수로 인한 폭발적인 스트리밍 수익 증가를 타겟으로 한 메가 이벤트 RWA.', imageUrl: 'https://images.unsplash.com/photo-1518605368461-1e1e38ce7058?q=80&w=1000&auto=format&fit=crop', expectedApy: 20.0, maturityDate: '2026-08-31T23:59:59Z', targetAmount: 80000, currentAmount: 20000, status: 'funding' },
  { id: 'demo-product-17', creatorName: '김계란 (가상 데모)', title: '피지컬 갤러리 차기 대형 프로젝트 펀딩', description: '가짜사나이를 이을 피지컬 갤러리의 차기 대형 웹 예능 제작비 및 수익 배분.', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop', expectedApy: 17.0, maturityDate: '2027-12-31T23:59:59Z', targetAmount: 60000, currentAmount: 60000, status: 'active' },
  { id: 'demo-product-18', creatorName: '워크맨 (가상 데모)', title: '웹 예능 채널 2025 상반기 수익 정산', description: '웹 예능의 대명사 워크맨 채널의 확정된 상반기 브랜디드 광고 수익 권리.', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop', expectedApy: 7.0, maturityDate: '2025-06-30T23:59:59Z', targetAmount: 50000, currentAmount: 50000, status: 'completed' },
  { id: 'demo-product-19', creatorName: '침착맨 (가상 데모)', title: 'TRPG 및 보드게임 기획 콘텐츠 수익권', description: '침착맨 채널의 스핀오프 콘텐츠 시리즈에 특화된 프로젝트 파이낸싱.', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop', expectedApy: 11.5, maturityDate: '2026-10-31T23:59:59Z', targetAmount: 15000, currentAmount: 7000, status: 'funding' },
  { id: 'demo-product-20', creatorName: '총몇명 (가상 데모)', title: '애니메이션 채널 2026년 IP 확장 펀딩', description: '유튜브 애니메이션 시리즈의 굿즈 및 해외 수출 수익에 연동된 장기 투자 상품.', imageUrl: 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?q=80&w=1000&auto=format&fit=crop', expectedApy: 15.5, maturityDate: '2028-12-31T23:59:59Z', targetAmount: 20000, currentAmount: 20000, status: 'active' },
  { id: 'demo-product-21', creatorName: '띱 (가상 데모)', title: '스케치 코미디 2026년 상반기 수익', description: '급격히 성장 중인 스케치 코미디 채널의 조회수 폭발 기대 수익권.', imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop', expectedApy: 19.0, maturityDate: '2026-06-30T23:59:59Z', targetAmount: 25000, currentAmount: 11000, status: 'funding' },
  { id: 'demo-product-22', creatorName: '숏박스 (가상 데모)', title: '하이퍼리얼리즘 코미디 2025 수익 정산', description: '숏박스의 메가 히트 콘텐츠 수익에 기반한 단기 채권형 상품.', imageUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=80&w=1000&auto=format&fit=crop', expectedApy: 9.0, maturityDate: '2025-12-31T23:59:59Z', targetAmount: 40000, currentAmount: 40000, status: 'completed' },
  { id: 'demo-product-23', creatorName: '너덜트 (가상 데모)', title: '오리지널 콘텐츠 제작 지원 펀딩', description: '너덜트 스튜디오의 새로운 오리지널 콘텐츠 제작을 위한 2년 만기 상품.', imageUrl: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?q=80&w=1000&auto=format&fit=crop', expectedApy: 12.0, maturityDate: '2027-12-31T23:59:59Z', targetAmount: 30000, currentAmount: 18000, status: 'funding' },
  { id: 'demo-product-24', creatorName: '지식해적단 (가상 데모)', title: '역사/지식 콘텐츠 글로벌 번역 프로젝트', description: '한국어 콘텐츠를 다국어로 더빙/번역하여 발생하는 추가 해외 수익에 대한 권리.', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop', expectedApy: 13.5, maturityDate: '2027-06-30T23:59:59Z', targetAmount: 10000, currentAmount: 10000, status: 'active' },
];

const fetchProducts = async (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PRODUCTS);
    }, 500);
  });
};

const fetchProduct = async (productId: string): Promise<Product | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      resolve(product || null);
    }, 500);
  });
};

export function useProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return { products: products || [], isLoading };
}

export function useProduct(productId: string | null) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId,
  });

  return { product, isLoading };
}
