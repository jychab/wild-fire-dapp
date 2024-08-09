// import { useGetTokenDetails } from '@/components/profile/profile-data-access';
// import { PublicKey } from '@solana/web3.js';
// import {
//   collection,
//   DocumentData,
//   onSnapshot,
//   orderBy,
//   query,
//   QuerySnapshot,
//   where,
// } from 'firebase/firestore';
// import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
// import Image from 'next/image';
// import {
//   memo,
//   RefObject,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from 'react';
// import { db } from '../firebase/firebase';

// function getNearestPrevious15Minutes(currentTime: number) {
//   const now = new Date(currentTime * 1000);
//   const minutes = now.getMinutes();
//   const nearestQuarter = Math.floor(minutes / 15) * 15;

//   now.setMinutes(nearestQuarter, 0, 0);
//   return now;
// }

// const createCandle = (val: number, time: number, volume: number) => ({
//   time,
//   open: val,
//   high: val,
//   low: val,
//   close: val,
//   value: volume,
// });

// const updateCandle = (candle: Candle, val: number, volume: number) => ({
//   time: candle.time,
//   close: val,
//   open: candle.open,
//   low: Math.min(candle.low, val),
//   high: Math.max(candle.high, val),
//   value: candle.value + volume,
// });

// interface Candle {
//   time: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   value: number;
// }

// const useInitializeChart = (
//   containerRef: RefObject<HTMLDivElement>,
//   data: DocumentData[] | null | undefined
// ) => {
//   const chartRef = useRef<any>(null);
//   const [seriesRef, setSeriesRef] = useState<any>(null);
//   const [volumeRef, setVolumeRef] = useState<any>(null);

//   useEffect(() => {
//     if (!containerRef.current || !data) return;

//     const chart = createChart(containerRef.current, {
//       width: containerRef.current.clientWidth,
//       height: containerRef.current.clientHeight,
//       layout: {
//         background: { color: '#222' },
//         textColor: '#DDD',
//       },
//       grid: {
//         vertLines: { color: '#444' },
//         horzLines: { color: '#444' },
//       },

//       rightPriceScale: {
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.3,
//         },
//       },
//       timeScale: {
//         rightOffset: 50,
//         timeVisible: true,
//         tickMarkFormatter: (timestamp: number) => {
//           const date = new Date(timestamp * 1000);
//           return `${date.getHours()}:${String(date.getMinutes()).padStart(
//             2,
//             '0'
//           )}`;
//         },
//       },
//     });

//     const volumeSeries = chart.addHistogramSeries({
//       priceFormat: { type: 'volume' },
//       priceScaleId: '',
//       color: '#26a69a', // Default color
//     });

//     volumeSeries.priceScale().applyOptions({
//       scaleMargins: { top: 0.8, bottom: 0 },
//     });

//     const series = chart.addCandlestickSeries({
//       upColor: '#26a69a',
//       downColor: '#ef5350',
//       borderVisible: true,
//       wickUpColor: '#26a69a',
//       wickDownColor: '#ef5350',
//       priceScaleId: 'right',
//       priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
//     });

//     chart.applyOptions({
//       crosshair: {
//         mode: CrosshairMode.Normal,
//         vertLine: {
//           width: 1,
//           color: '#C3BCDB44',
//           style: LineStyle.Solid,
//           labelBackgroundColor: '#9B7DFF',
//         },
//         horzLine: { color: '#9B7DFF', labelBackgroundColor: '#9B7DFF' },
//       },
//     });

//     series.setData(
//       data.map((d) => ({
//         time: d.time,
//         open: d.open,
//         high: d.high,
//         low: d.low,
//         close: d.close,
//       }))
//     );

//     volumeSeries.setData(
//       data.map((d) => ({
//         time: d.time,
//         value: d.volume,
//         color: d.close > d.open ? '#26a69a' : '#ef5350',
//       }))
//     );

//     chart.timeScale().fitContent();

//     chartRef.current = chart;
//     setSeriesRef(series);
//     setVolumeRef(volumeSeries);

//     return () => {
//       if (chartRef.current) {
//         chartRef.current.remove();
//         chartRef.current = null;
//         setSeriesRef(null);
//         setVolumeRef(null);
//       }
//     };
//   }, [containerRef, data]);

//   return { seriesRef, volumeRef };
// };

// const TradingViewChart = memo(({ mint }: { mint: string }) => {
//   const currentTimeRef = useRef(Date.now() / 1000);
//   const chartContainerRef = useRef<HTMLDivElement>(null);

//   const currentCandle = useRef<Candle>();
//   const { data } = useGetOhlcv({
//     mint: new PublicKey(mint),
//     from: currentTimeRef.current - 60 * 60 * 24,
//     to: currentTimeRef.current,
//   });
//   const { seriesRef, volumeRef } = useInitializeChart(chartContainerRef, data);
//   const { data: metadata } = useGetTokenDetails({ mint: new PublicKey(mint) });
//   const { data: price } = useGetPrice({ mint: new PublicKey(mint) });

//   const handleSnapshot = useCallback(
//     async (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
//       snapshot
//         .docChanges()
//         .filter((x) => x.type === 'added')
//         .forEach((x) => {
//           const newRealTimeData = x.doc.data() as {
//             buy: boolean;
//             inputAmount: number;
//             liquidityAfter: number;
//             liquidityBefore: number;
//             mint: string;
//             outputAmount: number;
//             price: number;
//             timestamp: number;
//             user: string;
//             volume: number;
//           };
//           const time = newRealTimeData.timestamp;
//           const price = newRealTimeData.price;
//           const volume = newRealTimeData.volume;
//           if (!currentCandle.current || currentCandle.current.time < time) {
//             const candle = createCandle(
//               price,
//               getNearestPrevious15Minutes(time).getTime() / 1000 + 15 * 60,
//               volume
//             );
//             currentCandle.current = candle;
//           } else {
//             const newCandle = updateCandle(
//               currentCandle.current,
//               price,
//               volume
//             );
//             currentCandle.current = newCandle;
//           }
//         });

//       if (seriesRef && currentCandle.current) {
//         seriesRef.update(currentCandle.current);
//       }

//       if (volumeRef && currentCandle.current) {
//         volumeRef.update({
//           ...currentCandle.current,
//           color:
//             currentCandle.current.close > currentCandle.current.open
//               ? '#26a69a'
//               : '#ef5350',
//         });
//       }
//     },
//     [seriesRef, volumeRef]
//   );

//   useEffect(() => {
//     if (!seriesRef || !volumeRef) return;
//     const swapEventsRef = collection(db, `Trading/${mint}/Swaps`);
//     const q = query(
//       swapEventsRef,
//       where(
//         'timestamp',
//         '>=',
//         getNearestPrevious15Minutes(currentTimeRef.current).getTime() / 1000
//       ),
//       orderBy('timestamp')
//     );

//     const unsubscribe = onSnapshot(q, handleSnapshot);
//     return () => unsubscribe();
//   }, [mint, seriesRef, volumeRef, handleSnapshot]);

//   return (
//     <div
//       ref={chartContainerRef}
//       className="z-0"
//       style={{ position: 'relative', width: '100%', height: '100%' }}
//     >
//       <div className="absolute top-4 left-4 text-base z-10 flex items-center gap-2 bg-base-100 px-4 py-2 rounded">
//         {metadata?.content?.links?.image && (
//           <Image
//             width={28}
//             height={28}
//             src={metadata?.content?.links?.image!}
//             alt={''}
//             className="rounded"
//           />
//         )}
//         <span>{`${metadata?.content?.metadata.symbol}-USDC`}</span>
//         <span>.</span>
//         <span>{'15m'}</span>
//         <span>.</span>
//         <span>{`$${(
//           metadata?.token_info?.price_info?.price_per_token ||
//           price ||
//           0
//         ).toPrecision(6)}`}</span>
//       </div>

//       {data?.length == 0 && (
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-lg font-semibold z-10 bg-base-100 px-4 py-2 rounded">
//           No Liquidity Pool Found
//         </div>
//       )}
//     </div>
//   );
// });

// export default TradingViewChart;
