import { DEFAULT_MINT_DECIMALS, NATIVE_MINT_DECIMALS } from '@/utils/consts';
import { formatLargeNumber } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import { NATIVE_MINT } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from 'firebase/firestore';
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts';
import Image from 'next/image';
import {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { db } from '../../utils/firebase/firebase';
import {
  calculatePriceInSOL,
  useGetAsset,
  useGetLiquidityPool,
  useGetOhlcv,
} from './trading-data-access';

function getNearestPrevious15Minutes(currentTime: number) {
  const now = new Date(currentTime * 1000);
  const minutes = now.getMinutes();
  const nearestQuarter = Math.floor(minutes / 15) * 15;

  now.setMinutes(nearestQuarter, 0, 0);
  return now;
}

const createCandle = (val: number, time: number, volume: number) => ({
  time,
  open: val,
  high: val,
  low: val,
  close: val,
  value: volume,
});

const updateCandle = (candle: Candle, val: number, volume: number) => ({
  time: candle.time,
  close: val,
  open: candle.open,
  low: Math.min(candle.low, val),
  high: Math.max(candle.high, val),
  value: candle.value + volume,
});

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  value: number;
}

const useInitializeChart = (
  containerRef: RefObject<HTMLDivElement>,
  data: DocumentData[] | null | undefined
) => {
  const chartRef = useRef<any>(null);
  const [seriesRef, setSeriesRef] = useState<any>(null);
  const [volumeRef, setVolumeRef] = useState<any>(null);

  const resizeChart = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      chartRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    }
  }, [containerRef]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#253248' },
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: { color: '#334158' },
        horzLines: { color: '#334158' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#485c7b',
        scaleMargins: { top: 0.2, bottom: 0.3 },
      },
      timeScale: {
        borderColor: '#485c7b',
        rightOffset: 50,
        timeVisible: true,
        tickMarkFormatter: (timestamp: number) => {
          const date = new Date(timestamp * 1000);
          return `${date.getHours()}:${String(date.getMinutes()).padStart(
            2,
            '0'
          )}`;
        },
      },
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: '#26a69a',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: true,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceScaleId: 'right',
      priceFormat: { type: 'price', precision: 12, minMove: 0.00000000001 },
    });

    chart.applyOptions({
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#C3BCDB44',
          style: LineStyle.Solid,
          labelBackgroundColor: '#9B7DFF',
        },
        horzLine: { color: '#9B7DFF', labelBackgroundColor: '#9B7DFF' },
      },
    });
    // Set actual data
    series.setData(
      data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );
    volumeSeries.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume / 10 ** DEFAULT_MINT_DECIMALS,
        color: d.close > d.open ? '#26a69a' : '#ef5350',
      }))
    );

    chart.timeScale().fitContent();

    chartRef.current = chart;
    setSeriesRef(series);
    setVolumeRef(volumeSeries);

    window.addEventListener('resize', resizeChart);

    return () => {
      window.removeEventListener('resize', resizeChart);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        setSeriesRef(null);
        setVolumeRef(null);
      }
    };
  }, [containerRef, data, resizeChart]);

  return { seriesRef, volumeRef };
};

const TradingViewChart = memo(
  ({
    collectionMint,
    metadata,
  }: {
    collectionMint: PublicKey | null;
    metadata: DAS.GetAssetResponse | null | undefined;
  }) => {
    const [currentPrice, setCurrentPrice] = useState<number>();
    const currentTimeRef = useRef(Date.now() / 1000);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const currentCandle = useRef<Candle>();
    const { data } = useGetOhlcv({
      mint: collectionMint,
      from: currentTimeRef.current - 60 * 60 * 24,
      to: currentTimeRef.current,
    });
    const { data: solTokenPrice } = useGetAsset({ mint: NATIVE_MINT });
    const { seriesRef, volumeRef } = useInitializeChart(
      chartContainerRef,
      data
    );
    const { data: liquidityPoolData } = useGetLiquidityPool({
      mint: metadata ? new PublicKey(metadata.id) : null,
    });

    const handleSnapshot = useCallback(
      async (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        snapshot
          .docChanges()
          .filter((x) => x.type === 'added')
          .forEach((x) => {
            const newRealTimeData = x.doc.data() as {
              event: 'buy' | 'sell';
              amount: number;
              amountOut: number;
              memberMint: string;
              priceInLamports: number;
              volume: number;
              timestamp: number;
            };
            const time = newRealTimeData.timestamp;
            const price =
              (newRealTimeData.priceInLamports *
                solTokenPrice!.token_info!.price_info!.price_per_token) /
              10 ** NATIVE_MINT_DECIMALS;
            const volume = newRealTimeData.volume / 10 ** DEFAULT_MINT_DECIMALS;
            if (!currentCandle.current || currentCandle.current.time < time) {
              const candle = createCandle(
                price,
                getNearestPrevious15Minutes(time).getTime() / 1000 + 15 * 60,
                volume
              );
              currentCandle.current = candle;
            } else {
              const newCandle = updateCandle(
                currentCandle.current,
                price,
                volume
              );
              currentCandle.current = newCandle;
            }
            setCurrentPrice(price);
          });

        if (seriesRef && currentCandle.current) {
          seriesRef.update(currentCandle.current);
        }

        if (volumeRef && currentCandle.current) {
          volumeRef.update({
            ...currentCandle.current,
            color:
              currentCandle.current.close > currentCandle.current.open
                ? '#26a69a'
                : '#ef5350',
          });
        }
      },
      [seriesRef, volumeRef, solTokenPrice]
    );

    useEffect(() => {
      if (!seriesRef || !volumeRef) return;
      const swapEventsRef = collection(
        db,
        `Mint/${collectionMint?.toBase58()}/TradeEvents`
      );

      const q = query(
        swapEventsRef,
        where(
          'timestamp',
          '>=',
          getNearestPrevious15Minutes(currentTimeRef.current).getTime() / 1000
        ),
        orderBy('timestamp')
      );

      const unsubscribe = onSnapshot(q, handleSnapshot);
      return () => unsubscribe();
    }, [collectionMint, seriesRef, volumeRef, handleSnapshot]);

    return (
      <div
        ref={chartContainerRef}
        className="z-0 w-full flex"
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <div className="absolute top-4 left-4 text-base z-10 flex items-center gap-2 bg-base-100 px-4 py-2 rounded">
          {metadata?.content?.links?.image && (
            <Image
              width={28}
              height={28}
              src={metadata?.content?.links?.image!}
              alt={''}
              className="rounded"
            />
          )}
          <span>{`${metadata?.content?.metadata.symbol}`}</span>
          <span>.</span>
          <span>{'15m'}</span>
          <span>.</span>
          <span>{`$${formatLargeNumber(
            currentPrice ||
              (liquidityPoolData &&
              !Number.isNaN(Number(liquidityPoolData.reserveTokenSold))
                ? calculatePriceInSOL(
                    Number(liquidityPoolData.reserveTokenSold)
                  ) *
                  (solTokenPrice?.token_info?.price_info?.price_per_token || 0)
                : 0)
          )}`}</span>
        </div>
      </div>
    );
  }
);

export default TradingViewChart;
