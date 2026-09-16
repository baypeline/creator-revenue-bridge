import { useQuery } from '@tanstack/react-query';
import { OfferingResponse } from '../types/product';

// 백엔드가 제공하는 OfferingResponse 구조에 맞춘 기본 상품 데이터
const MOCK_PRODUCTS: OfferingResponse[] = [
  {
    offeringId: 1,
    status: 'Funding',
    statusLabel: '모집 중',
    assetKey: 'DEMO-YT-2026',
    creator: {
      name: '데모 크리에이터',
      platform: 'youtube',
      handle: '@democreator',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60'
    },
    title: '유튜브 광고 수익 선지급 수익권 (로컬 데모)',
    description: '최근 12개월 유튜브 광고 수익을 기반으로 향후 3개 정산 구간 동안 발생하는 적격 수익의 20%에 대한 청구권을 발행하는 로컬 데모 상품입니다.',
    settlementCurrency: { symbol: 'mUSD', decimals: 6 },
    terms: {
      unitsForSale: 100,
      unitPrice: { raw: '100000000', decimals: 6, display: '100.000000' },
      targetRaise: { raw: '10000000000', decimals: 6, display: '10000.000000' },
      revenueShareBps: 2000,
      revenueSharePercent: 20.0,
      fundingDeadline: '2026-12-19T14:48:41Z',
      revenueStart: '2026-12-20T14:48:41Z',
      revenueEnd: '2026-12-19T14:48:41Z'
    }
  },
  {
    offeringId: 2,
    status: 'Active',
    statusLabel: '모집 완료',
    assetKey: 'SHUKA-2026',
    creator: { name: '슈카월드 (가상 데모)', platform: 'youtube', handle: '@syukaworld', imageUrl: 'https://unavatar.io/youtube/@syukaworld' },
    title: '경제/금융 채널 2026 상반기 광고 수익권',
    description: '대한민국 대표 경제 유튜브 채널 슈카월드의 2026년 상반기 예상 수익을 기반으로 한 안전 자산 성격의 상품입니다.',
    settlementCurrency: { symbol: 'mUSD', decimals: 6 },
    terms: { unitsForSale: 200, unitPrice: { raw: '100000000', decimals: 6, display: '100.000000' }, targetRaise: { raw: '20000000000', decimals: 6, display: '20000.000000' }, revenueShareBps: 1500, revenueSharePercent: 15.0, fundingDeadline: '2026-06-30T23:59:59Z', revenueStart: '2026-07-01T00:00:00Z', revenueEnd: '2026-12-31T23:59:59Z' }
  },
  {
    offeringId: 3,
    status: 'Funding',
    statusLabel: '모집 중',
    assetKey: 'TZUYANG-2028',
    creator: { name: '쯔양 (가상 데모)', platform: 'youtube', handle: '@tzuyang6145', imageUrl: 'https://unavatar.io/youtube/@tzuyang6145' },
    title: '글로벌 먹방 채널 글로벌 확장 펀딩',
    description: '해외 구독자 비율이 급증하고 있는 쯔양 채널의 글로벌 진출 펀딩을 위한 브릿지 상품입니다.',
    settlementCurrency: { symbol: 'mUSD', decimals: 6 },
    terms: { unitsForSale: 500, unitPrice: { raw: '100000000', decimals: 6, display: '100.000000' }, targetRaise: { raw: '50000000000', decimals: 6, display: '50000.000000' }, revenueShareBps: 2000, revenueSharePercent: 20.0, fundingDeadline: '2028-12-31T23:59:59Z', revenueStart: '2029-01-01T00:00:00Z', revenueEnd: '2029-12-31T23:59:59Z' }
  },
];

const getBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://backend:8080/api';
  }
  return '/backend-api';
};

const fetchProducts = async (): Promise<OfferingResponse[]> => {
  try {
    const url = getBackendUrl();
    const res = await fetch(`${url}/offerings/1`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store'
    });
    if (res.ok) {
      const realProduct: OfferingResponse = await res.json();
      return [realProduct, ...MOCK_PRODUCTS.slice(1)];
    }
  } catch (error) {
    console.warn("Backend fetch fallback to initial data", error);
  }
  return MOCK_PRODUCTS;
};

const fetchProduct = async (productId: string): Promise<OfferingResponse | null> => {
  try {
    if (productId === '1') {
      const url = getBackendUrl();
      const res = await fetch(`${url}/offerings/1`, {
        signal: AbortSignal.timeout(3000),
        cache: 'no-store'
      });
      if (res.ok) return await res.json();
    }
  } catch (error) {
    console.warn("Product fetch fallback", error);
  }
  const mock = MOCK_PRODUCTS.find(p => p.offeringId.toString() === productId);
  return mock || null;
};

export function useProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    initialData: MOCK_PRODUCTS,
    staleTime: 10000,
  });

  return { products: products || MOCK_PRODUCTS, isLoading: false };
}

export function useProduct(productId: string | null) {
  const initial = MOCK_PRODUCTS.find(p => p.offeringId.toString() === productId);
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId,
    initialData: initial || undefined,
  });

  return { product: product || initial || null, isLoading: false };
}
