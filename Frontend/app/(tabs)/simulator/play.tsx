import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions, Modal, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Play, TrendingUp, TrendingDown, Eye, Search, ShoppingCart, BarChart3, Star, Brain, Zap, Shield, AlertTriangle, ChevronRight, X, Minus, Plus, Activity, Lock, CircleDollarSign, Unlock, Crosshair } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { getCaseById, SimulationCase } from '@/data/simulatorCases';
import { MarketForces, DEFAULT_FORCES, HARSHAD_ASSETS, AssetConfig, AssetReturn, calculateBubbleScore, calculateCrashProbability, calculateWeeklyReturns, applyEventImpact, applyAllModifiers, estimateSensexLevel } from '@/data/marketEngine';
import { HARSHAD_ACTORS, getAllActorModifiers, getActorNarrative } from '@/data/marketActors';
import { PlayerPsychology, DEFAULT_PSYCHOLOGY, PlayerPortfolio, createInitialPortfolio, getTotalPortfolioValue, getTotalPL, executeTrade, updatePortfolioPrices, InvestigationState, DEFAULT_INVESTIGATION, HARSHAD_SIGNALS, HiddenSignal, ConvictionBet, scoreConviction, RiskAppetite, updatePsychology, detectStrategyIdentity, determineEnding } from '@/data/playerState';
import * as Haptics from 'expo-haptics';
import { playSound } from '@/utils/sounds';

const { width: SW } = Dimensions.get('window');
const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString('en-IN')}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BouncyButton = ({ onPress, title, color = Colors.primary, darkColor = Colors.primaryDark, icon: Icon, style, disabled }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    return (
        <Pressable
            onPressIn={() => !disabled && Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
            onPressOut={() => !disabled && Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
            onPress={disabled ? undefined : onPress}
            style={[{ opacity: disabled ? 0.6 : 1 }, style]}
        >
            <Animated.View style={{
                backgroundColor: color, borderBottomWidth: disabled ? 0 : 4, borderBottomColor: darkColor, borderRadius: 24, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, transform: [{ scale: scaleAnim }], paddingHorizontal: 20
            }}>
                {Icon && <Icon size={20} color="#FFF" strokeWidth={3} />}
                <Text style={{ fontFamily: Typography.fontFamily.black, fontSize: 17, color: '#FFF' }}>{title}</Text>
            </Animated.View>
        </Pressable>
    )
}

export default function SimulationPlayScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ caseId: string }>();
    const simCase = getCaseById(params.caseId || '');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const crashAnim = useRef(new Animated.Value(0)).current;

    // Core state
    const [phase, setPhase] = useState<'intro' | 'news' | 'investigate' | 'trade' | 'conviction' | 'resolve' | 'crisis' | 'done'>('intro');
    const [week, setWeek] = useState(0);
    const [forces, setForces] = useState<MarketForces>({ ...DEFAULT_FORCES });
    const [psychology, setPsychology] = useState<PlayerPsychology>({ ...DEFAULT_PSYCHOLOGY });
    const [portfolio, setPortfolio] = useState<PlayerPortfolio>(createInitialPortfolio(simCase?.startingCapitalNum || 1000000));
    const [prices, setPrices] = useState<number[]>(HARSHAD_ASSETS.map(a => a.basePrice));
    const [investigation, setInvestigation] = useState<InvestigationState>({ ...DEFAULT_INVESTIGATION });
    const [predictions, setPredictions] = useState<ConvictionBet[]>([]);
    const [bubbleScore, setBubbleScore] = useState(0);
    const [crashTriggered, setCrashTriggered] = useState(false);
    const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('balanced');
    const [weekReturns, setWeekReturns] = useState<AssetReturn[]>([]);
    const [actorNarr, setActorNarr] = useState<string[]>([]);
    const [sensexLevel, setSensexLevel] = useState(1000);
    // Conviction state
    const [convStars, setConvStars] = useState(3);
    const [convPred, setConvPred] = useState<'bull' | 'bear' | 'flat'>('bull');
    // Trade modal
    const [tradeModal, setTradeModal] = useState<{ asset: AssetConfig; idx: number } | null>(null);
    const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
    const [tradeQty, setTradeQty] = useState('1');
    // Signal modal
    const [signalModal, setSignalModal] = useState<HiddenSignal | null>(null);

    const totalWeeks = simCase?.timeline.length || 10;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        ]).start();
    }, [phase, week]);

    if (!simCase) {
        return <View style={s.center}><Text style={s.errTxt}>Case not found</Text><Pressable onPress={() => router.back()}><Text style={s.linkTxt}>Go Back</Text></Pressable></View>;
    }

    const totalVal = getTotalPortfolioValue(portfolio);
    const totalPL = getTotalPL(portfolio, simCase.startingCapitalNum);
    const plPct = ((totalPL / simCase.startingCapitalNum) * 100).toFixed(1);
    const weekData = simCase.timeline[week];
    const availableSignals = HARSHAD_SIGNALS.filter(sig => sig.weekAvailable <= week && !investigation.discoveredSignals.includes(sig.id));

    // ── Phase Handlers ─────────────────────────────
    const startGame = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) } catch { } playSound('tap'); setPhase('news'); fadeAnim.setValue(0); slideAnim.setValue(30); };

    const goInvestigate = () => { playSound('tap'); setPhase('investigate'); fadeAnim.setValue(0); slideAnim.setValue(30); };
    const goTrade = () => { playSound('tap'); setPhase('trade'); fadeAnim.setValue(0); slideAnim.setValue(30); };
    const goConviction = () => { playSound('tap'); setPhase('conviction'); fadeAnim.setValue(0); slideAnim.setValue(30); };

    const investigateSignal = (sig: HiddenSignal) => {
        if (investigation.investigationTokens < sig.difficulty) {
            playSound('wrong');
            Alert.alert('Not enough tokens');
            return;
        }
        playSound('levelup');
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) } catch { }
        setInvestigation(prev => ({ discoveredSignals: [...prev.discoveredSignals, sig.id], investigationTokens: prev.investigationTokens - sig.difficulty }));
        setSignalModal(sig);
    };

    const doTrade = () => {
        if (!tradeModal) return;
        const qty = parseInt(tradeQty) || 0;
        if (qty <= 0) { playSound('wrong'); Alert.alert('Invalid quantity'); return; }
        const price = prices[tradeModal.idx];
        const result = executeTrade(portfolio, tradeModal.asset.name, tradeModal.asset.type, tradeAction, qty, price, week);
        if (!result.success) { playSound('wrong'); Alert.alert('Trade Failed', result.error); return; }

        playSound('correct');
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) } catch { }
        setPortfolio(result.portfolio);
        setTradeModal(null);
        setTradeQty('1');
    };

    const resolveWeek = () => {
        playSound('tap');
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) } catch { }
        // Save conviction bet
        const bet: ConvictionBet = { weekNumber: week, conviction: convStars, prediction: convPred };
        // Apply event force modifiers from timeline
        let newForces = { ...forces };
        if (weekData) {
            weekData.events.forEach((ev: any) => {
                if (ev.forceModifiers) newForces = applyEventImpact(newForces, ev.forceModifiers);
            });
        }
        // Apply actor behaviors
        const actorMods = getAllActorModifiers(HARSHAD_ACTORS, newForces, week, crashTriggered);
        newForces = applyAllModifiers(newForces, actorMods);
        const narr = getActorNarrative(HARSHAD_ACTORS, newForces, week, crashTriggered);
        setActorNarr(narr);
        // Calculate bubble & crash
        const bs = calculateBubbleScore(newForces);
        setBubbleScore(bs);
        const crashProb = calculateCrashProbability(bs, week, newForces.regulationRisk);
        let didCrash = crashTriggered;
        if (!didCrash && week >= 4 && crashProb > 0.5) { didCrash = true; setCrashTriggered(true); }
        // Calculate returns
        const returns = calculateWeeklyReturns(newForces, HARSHAD_ASSETS, prices, didCrash, week);
        setWeekReturns(returns);
        const newPrices = returns.map(r => r.currentPrice);
        setPrices(newPrices);
        // Update portfolio prices
        const priceMap: Record<string, number> = {};
        returns.forEach(r => { priceMap[r.name] = r.currentPrice; });
        const updatedPortfolio = updatePortfolioPrices(portfolio, priceMap);
        setPortfolio(updatedPortfolio);
        // Sensex
        const sl = estimateSensexLevel(1000, newForces, week, didCrash);
        setSensexLevel(sl);
        // Score conviction
        const avgReturn = returns.reduce((s, r) => s + r.weeklyReturnPct, 0) / returns.length;
        bet.actualReturn = avgReturn;
        bet.pointsEarned = scoreConviction(bet, avgReturn);
        setPredictions(prev => [...prev, bet]);
        // Psychology
        const newPsych = updatePsychology(psychology, avgReturn, bs, didCrash);
        setPsychology(newPsych);
        setForces(newForces);
        // Show resolve
        setPhase('resolve');
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
    };

    const nextWeek = () => {
        playSound('tap');
        if (week >= totalWeeks - 1) {
            // Game over — go to results
            const strategy = detectStrategyIdentity(portfolio.tradeHistory, portfolio, simCase.startingCapitalNum);
            const ending = determineEnding(portfolio, psychology, predictions, strategy, simCase.startingCapitalNum, investigation.discoveredSignals.length, HARSHAD_SIGNALS.length);
            router.replace({
                pathname: '/simulator/results', params: {
                    caseId: simCase.id, finalPortfolio: String(getTotalPortfolioValue(portfolio)),
                    startingCapital: String(simCase.startingCapitalNum), divScore: String(50),
                    decisionsMade: String(portfolio.tradeHistory.length), currency: simCase.currency,
                    endingType: ending.ending, endingTitle: ending.title, endingEmoji: ending.emoji,
                    endingDesc: ending.description, strategyId: strategy,
                    predictionScore: String(predictions.reduce((s, p) => s + (p.pointsEarned || 0), 0)),
                    signalsFound: String(investigation.discoveredSignals.length),
                    totalSignals: String(HARSHAD_SIGNALS.length),
                    greed: String(Math.round(psychology.greed)), fear: String(Math.round(psychology.fear)),
                    confidence: String(Math.round(psychology.confidence)), patience: String(Math.round(psychology.patience)),
                }
            });
            return;
        }
        setWeek(w => w + 1);
        setInvestigation(prev => ({ ...prev, investigationTokens: prev.investigationTokens }));
        setConvStars(3); setConvPred('bull');
        setPhase('news');
        fadeAnim.setValue(0); slideAnim.setValue(30);
    };

    // ── Bubble meter color ─────────────────────────
    const bubbleColor = bubbleScore < 30 ? '#22C55E' : bubbleScore < 60 ? '#F59E0B' : '#EF4444';

    // ══════════════════════════════════════════════════
    //  INTRO PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }]}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={s.introTag}>{simCase.year} • {simCase.difficultyLabel}</Text>
                    <Text style={s.introTitle}>{simCase.title}</Text>
                    <Text style={s.introSub}>{simCase.subtitle}</Text>
                    <View style={s.divider} />
                    <Text style={s.sectionLabel}>Historical Context</Text>
                    <Text style={s.bodyText}>{simCase.context}</Text>
                    {simCase.historicalBackground && (<><View style={s.divider} /><Text style={s.sectionLabel}>The Backstory</Text><Text style={s.bodyText}>{simCase.historicalBackground}</Text></>)}
                    {simCase.keyFigures?.length > 0 && (<><View style={s.divider} /><Text style={s.sectionLabel}>Key Figures</Text>
                        {simCase.keyFigures.map((f: { name: string; role: string; bio: string }, i: number) => (
                            <View key={i} style={{ marginBottom: 12 }}>
                                <Text style={s.figureName}>{f.name} <Text style={s.figureRole}>• {f.role}</Text></Text>
                                <Text style={s.figureBio}>{f.bio}</Text>
                            </View>
                        ))}</>)}
                    <View style={s.divider} />
                    <Text style={s.sectionLabel}>Starting Capital</Text>
                    <Text style={s.capitalText}>{simCase.startingCapital}</Text>
                    <Text style={s.sectionLabel}>Risk Appetite</Text>
                    <View style={s.riskRow}>
                        {(['conservative', 'balanced', 'aggressive'] as RiskAppetite[]).map(r => (
                            <Pressable key={r} style={[s.riskBtn, riskAppetite === r && s.riskBtnActive]} onPress={() => setRiskAppetite(r)}>
                                <Text style={[s.riskBtnTxt, riskAppetite === r && s.riskBtnTxtActive]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <BouncyButton title="Begin Simulation" icon={Play} onPress={startGame} style={{ marginTop: 10 }} />
                </Animated.View>
            </ScrollView>
        );
    }

    // ══════════════════════════════════════════════════
    //  TOP BAR (shared across gameplay phases)
    // ══════════════════════════════════════════════════
    const TopBar = () => (
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={s.topBarRow}>
                <Text style={s.topBarWeek}>Week {week + 1}/{totalWeeks}</Text>
                <View style={s.topBarRight}>
                    <View style={s.cashBadge}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CircleDollarSign size={14} color="#22C55E" strokeWidth={2.5} />
                            <Text style={s.cashBadgeTxt}>{fmt(portfolio.cash)}</Text>
                        </View>
                    </View>
                </View>
            </View>
            {/* Psychology HUD */}
            <View style={s.psychRow}>
                {[{ l: 'Greed', v: psychology.greed, c: '#F59E0B' }, { l: 'Fear', v: psychology.fear, c: '#EF4444' }, { l: 'Confidence', v: psychology.confidence, c: '#3B82F6' }, { l: 'Patience', v: psychology.patience, c: '#22C55E' }].map(p => (
                    <View key={p.l} style={s.psychItem}>
                        <Text style={s.psychLabel}>{p.l}</Text>
                        <View style={s.psychBarBg}><View style={[s.psychBarFill, { width: `${p.v}%`, backgroundColor: p.c }]} /></View>
                    </View>
                ))}
            </View>
            {/* Dashboard strip */}
            <View style={s.dashStrip}>
                <View style={s.dashItem}><Text style={s.dashLabel}>Sensex</Text><Text style={s.dashVal}>{sensexLevel.toLocaleString()}</Text></View>
                <View style={s.dashItem}><Text style={s.dashLabel}>Bubble</Text><Text style={[s.dashVal, { color: bubbleColor }]}>{bubbleScore}%</Text></View>
                <View style={s.dashItem}><Text style={s.dashLabel}>P&L</Text><Text style={[s.dashVal, { color: totalPL >= 0 ? '#22C55E' : '#EF4444' }]}>{Number(plPct) >= 0 ? '+' : ''}{plPct}%</Text></View>
                <View style={s.dashItem}><Text style={s.dashLabel}>Cash</Text><Text style={s.dashVal}>{fmt(portfolio.cash)}</Text></View>
            </View>
        </View>
    );

    // ══════════════════════════════════════════════════
    //  NEWS PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'news') {
        return (
            <View style={s.container}>
                <TopBar />
                <ScrollView contentContainerStyle={s.phaseScroll}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={s.phaseTitle}>{weekData?.title || `Week ${week + 1}`}</Text>
                        <Text style={s.phaseSub}>{weekData?.subtitle || ''}</Text>
                        <View style={s.divider} />
                        {weekData?.events.map((ev: any, i: number) => (
                            <View key={ev.id || i} style={[s.newsCard, ev.type === 'breaking' && { borderLeftColor: '#EF4444' }, ev.type === 'warning' && { borderLeftColor: '#F59E0B' }, ev.type === 'positive' && { borderLeftColor: '#22C55E' }]}>
                                <Text style={s.newsType}>{ev.type?.toUpperCase()}</Text>
                                <Text style={s.newsText}>{ev.text}</Text>
                                {ev.historicalDate && <Text style={s.newsDate}>{ev.historicalDate}</Text>}
                            </View>
                        ))}
                        <BouncyButton title={`Investigate Market`} icon={Search} onPress={goInvestigate} style={{ marginTop: 24 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    // ══════════════════════════════════════════════════
    //  INVESTIGATE PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'investigate') {
        return (
            <View style={s.container}>
                <TopBar />
                <ScrollView contentContainerStyle={s.phaseScroll}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={s.investigateHeaderRow}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: Colors.primary + '20', padding: 6, borderRadius: 10 }}>
                                        <Search size={22} color={Colors.primary} strokeWidth={2.5} />
                                    </View>
                                    <Text style={s.phaseTitle}>Investigation</Text>
                                </View>
                                <Text style={s.phaseSubInvestigate}>Insider info costs tokens</Text>
                            </View>
                            <View style={s.tokenBadgeDuolingo}>
                                <Zap size={18} color="#F59E0B" strokeWidth={3} fill="#F59E0B" />
                                <Text style={s.tokenBadgeTextDuolingo}>{investigation.investigationTokens}</Text>
                            </View>
                        </View>
                        <View style={s.divider} />
                        {availableSignals.length === 0 ? (
                            <Text style={s.emptyTxt}>No new signals to investigate this week.</Text>
                        ) : availableSignals.map(sig => {
                            const canAfford = investigation.investigationTokens >= sig.difficulty;
                            return (
                                <View key={sig.id} style={[s.sigCard, { backgroundColor: '#F8FAFC', borderLeftColor: Colors.textMuted }, !canAfford && { opacity: 0.7 }]}>
                                    <View style={s.sigTop}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                            <Lock size={12} color="#FFF" />
                                            <Text style={[s.sigCat, { color: '#FFF' }]}>{sig.category.replace('_', ' ').toUpperCase()}</Text>
                                        </View>
                                        <Text style={s.sigCost}>{sig.difficulty} Tokens</Text>
                                    </View>
                                    <Text style={[s.sigTitle, { color: Colors.secondary }]}>Locked Intel</Text>
                                    <Text style={s.sigDesc}>Unlock this intel to reveal market secrets before they affect prices.</Text>
                                    <BouncyButton
                                        title={`Unlock Information`}
                                        icon={Lock}
                                        color={canAfford ? "#8B5CF6" : Colors.inputBorder}
                                        darkColor={canAfford ? "#6D28D9" : Colors.textMuted}
                                        onPress={() => investigateSignal(sig)}
                                        style={{ marginTop: 14, height: 48 }}
                                    />
                                </View>
                            )
                        })}
                        {/* Previously discovered */}
                        {investigation.discoveredSignals.length > 0 && (
                            <><Text style={[s.sectionLabel, { marginTop: 20 }]}>Discovered</Text>
                                {HARSHAD_SIGNALS.filter(s => investigation.discoveredSignals.includes(s.id)).map(sig => (
                                    <View key={sig.id} style={[s.sigCard, { borderLeftColor: '#22C55E' }]}>
                                        <Text style={s.sigTitle}>{sig.title}</Text>
                                        <Text style={[s.sigDesc, { color: Colors.secondary }]}>{sig.revealedInfo}</Text>
                                    </View>
                                ))}</>
                        )}
                        <BouncyButton title="Trade Assets" icon={ShoppingCart} onPress={goTrade} style={{ marginTop: 24 }} />
                    </Animated.View>
                </ScrollView>
                {/* Signal reveal modal */}
                <Modal visible={!!signalModal} transparent animationType="fade">
                    <View style={s.modalBg}>
                        <View style={s.modalCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Unlock size={24} color="#F59E0B" strokeWidth={2.5} />
                                <Text style={[s.modalTitle, { marginTop: 0, marginBottom: 0 }]}>Signal Revealed!</Text>
                            </View>
                            <Text style={[s.sigCat, { marginTop: 12 }]}>{signalModal?.category.replace('_', ' ').toUpperCase()}</Text>
                            <Text style={[s.modalBody, { marginTop: 12 }]}>{signalModal?.revealedInfo}</Text>
                            <Pressable style={s.modalBtn} onPress={() => setSignalModal(null)}>
                                <Text style={s.modalBtnTxt}>Got It</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // ══════════════════════════════════════════════════
    //  TRADE PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'trade') {
        return (
            <View style={s.container}>
                <TopBar />
                <ScrollView contentContainerStyle={s.phaseScroll}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ backgroundColor: Colors.primary + '20', padding: 6, borderRadius: 10 }}>
                                <TrendingUp size={22} color={Colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={[s.phaseTitle, { marginTop: 0 }]}>Trading Desk</Text>
                        </View>
                        <Text style={[s.phaseSub, { color: '#22C55E', fontFamily: Typography.fontFamily.black, fontSize: 16 }]}>Cash Available: {fmt(portfolio.cash)}</Text>
                        <View style={s.divider} />
                        {HARSHAD_ASSETS.map((asset, idx) => {
                            const price = prices[idx];
                            const pos = portfolio.positions.find(p => p.assetName === asset.name);
                            return (
                                <View key={asset.name} style={s.tradeRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.tradeName}>{asset.name}</Text>
                                        <Text style={s.tradePrice}>₹{price.toLocaleString()}</Text>
                                        {pos && <Text style={s.tradePos}>Holding: {pos.quantity} @ ₹{pos.avgBuyPrice}</Text>}
                                    </View>
                                    <View style={s.tradeActions}>
                                        <Pressable style={s.buyBtn} onPress={() => { setTradeModal({ asset, idx }); setTradeAction('buy'); setTradeQty('1'); }}>
                                            <Text style={s.buyBtnTxt}>BUY</Text>
                                        </Pressable>
                                        {pos && <Pressable style={s.sellBtn} onPress={() => { setTradeModal({ asset, idx }); setTradeAction('sell'); setTradeQty(String(pos.quantity)); }}>
                                            <Text style={s.sellBtnTxt}>SELL</Text>
                                        </Pressable>}
                                    </View>
                                </View>
                            );
                        })}
                        {/* Positions summary */}
                        {portfolio.positions.length > 0 && (
                            <><View style={s.divider} /><Text style={s.sectionLabel}>Your Positions</Text>
                                {portfolio.positions.map(pos => {
                                    const pl = (pos.currentPrice - pos.avgBuyPrice) * pos.quantity;
                                    return (
                                        <View key={pos.assetName} style={s.posRow}>
                                            <Text style={s.posName}>{pos.assetName}</Text>
                                            <Text style={s.posQty}>{pos.quantity} units</Text>
                                            <Text style={[s.posPL, { color: pl >= 0 ? '#22C55E' : '#EF4444' }]}>{pl >= 0 ? '+' : ''}₹{pl.toLocaleString()}</Text>
                                        </View>
                                    );
                                })}</>
                        )}
                        <BouncyButton title="Set Conviction" icon={Star} onPress={goConviction} style={{ marginTop: 24 }} />
                    </Animated.View>
                </ScrollView>
                {/* Trade Modal */}
                <Modal visible={!!tradeModal} transparent animationType="slide">
                    <View style={s.modalBg}>
                        <View style={s.modalCard}>
                            <Text style={s.modalTitle}>{tradeAction === 'buy' ? 'Buy' : 'Sell'} {tradeModal?.asset.name}</Text>
                            <Text style={s.tradePrice}>Price: ₹{tradeModal ? prices[tradeModal.idx].toLocaleString() : 0}</Text>
                            <View style={s.qtyRow}>
                                <Pressable style={s.qtyBtn} onPress={() => setTradeQty(String(Math.max(1, (parseInt(tradeQty) || 1) - 1)))}><Minus size={18} color={Colors.secondary} /></Pressable>
                                <TextInput style={s.qtyInput} value={tradeQty} onChangeText={setTradeQty} keyboardType="numeric" />
                                <Pressable style={s.qtyBtn} onPress={() => setTradeQty(String((parseInt(tradeQty) || 0) + 1))}><Plus size={18} color={Colors.secondary} /></Pressable>
                            </View>
                            <Text style={s.tradeCost}>Total: ₹{((parseInt(tradeQty) || 0) * (tradeModal ? prices[tradeModal.idx] : 0)).toLocaleString()}</Text>
                            <View style={s.modalBtnRow}>
                                <Pressable style={[s.modalBtn, { flex: 1, backgroundColor: Colors.inputBorder }]} onPress={() => setTradeModal(null)}><Text style={[s.modalBtnTxt, { color: Colors.secondary }]}>Cancel</Text></Pressable>
                                <Pressable style={[s.modalBtn, { flex: 1, backgroundColor: tradeAction === 'buy' ? '#22C55E' : '#EF4444' }]} onPress={doTrade}><Text style={s.modalBtnTxt}>{tradeAction === 'buy' ? 'Confirm Buy' : 'Confirm Sell'}</Text></Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // ══════════════════════════════════════════════════
    //  CONVICTION PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'conviction') {
        return (
            <View style={s.container}>
                <TopBar />
                <ScrollView contentContainerStyle={s.phaseScroll}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ backgroundColor: Colors.primary + '20', padding: 6, borderRadius: 10 }}>
                                <Crosshair size={22} color={Colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={[s.phaseTitle, { marginTop: 0 }]}>Conviction & Prediction</Text>
                        </View>
                        <Text style={s.phaseSub}>How confident are you? Where is the market heading?</Text>
                        <View style={s.divider} />
                        <Text style={s.sectionLabel}>Conviction Level</Text>
                        <View style={s.starRow}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <Pressable key={n} onPress={() => setConvStars(n)}>
                                    <Star size={36} color={n <= convStars ? '#F59E0B' : Colors.inputBorder} strokeWidth={2} fill={n <= convStars ? '#F59E0B' : 'transparent'} />
                                </Pressable>
                            ))}
                        </View>
                        <Text style={s.convNote}>Higher conviction = more points if correct, more penalty if wrong</Text>
                        <View style={s.divider} />
                        <Text style={s.sectionLabel}>Market Prediction</Text>
                        <View style={s.predRow}>
                            {[{ k: 'bull' as const, l: 'Bullish', c: '#22C55E', icon: TrendingUp }, { k: 'flat' as const, l: 'Flat', c: '#F59E0B', icon: Minus }, { k: 'bear' as const, l: 'Bearish', c: '#EF4444', icon: TrendingDown }].map(p => {
                                const Icon = p.icon;
                                return (
                                    <Pressable key={p.k} style={[s.predBtn, convPred === p.k && { borderColor: p.c, backgroundColor: p.c + '20' }]} onPress={() => setConvPred(p.k)}>
                                        <Icon size={18} color={convPred === p.k ? p.c : Colors.textMuted} strokeWidth={2.5} style={{ marginBottom: 4 }} />
                                        <Text style={[s.predBtnTxt, convPred === p.k && { color: p.c }]}>{p.l}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <BouncyButton title="Resolve Week" icon={Activity} color="#8B5CF6" darkColor="#6D28D9" onPress={resolveWeek} style={{ marginTop: 24 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    // ══════════════════════════════════════════════════
    //  RESOLVE PHASE
    // ══════════════════════════════════════════════════
    if (phase === 'resolve') {
        const lastBet = predictions[predictions.length - 1];
        return (
            <View style={s.container}>
                <TopBar />
                <ScrollView contentContainerStyle={s.phaseScroll}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ backgroundColor: Colors.primary + '20', padding: 6, borderRadius: 10 }}>
                                <BarChart3 size={22} color={Colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={[s.phaseTitle, { marginTop: 0 }]}>Week {week + 1} Results</Text>
                        </View>
                        <Text style={s.phaseSub}>Market has resolved. Here's what happened.</Text>
                        <View style={s.divider} />
                        {/* Actor narratives */}
                        {actorNarr.length > 0 && (
                            <View style={s.narrBox}>
                                {actorNarr.map((n, i) => <Text key={i} style={s.narrTxt}>{n}</Text>)}
                            </View>
                        )}
                        {/* Price changes */}
                        <Text style={s.sectionLabel}>Asset Performance</Text>
                        {weekReturns.map(r => (
                            <View key={r.name} style={s.retRow}>
                                <Text style={s.retName}>{r.name}</Text>
                                <Text style={s.retPrice}>₹{r.currentPrice.toLocaleString()}</Text>
                                <Text style={[s.retPct, { color: r.weeklyReturnPct >= 0 ? '#22C55E' : '#EF4444' }]}>{r.weeklyReturnPct >= 0 ? '+' : ''}{r.weeklyReturnPct}%</Text>
                            </View>
                        ))}
                        {/* Prediction result */}
                        {lastBet && (
                            <View style={s.predResult}>
                                <Text style={s.sectionLabel}>Your Prediction</Text>
                                <Text style={s.predResultTxt}>You predicted {lastBet.prediction.toUpperCase()} with {lastBet.conviction}</Text>
                                <View style={{ flexDirection: 'row', marginTop: 4, marginBottom: 4 }}>
                                    {Array.from({ length: lastBet.conviction }).map((_, i) => (
                                        <Star key={i} size={16} color="#F59E0B" fill="#F59E0B" />
                                    ))}
                                </View>
                                <Text style={[s.predResultScore, { color: (lastBet.pointsEarned || 0) >= 0 ? '#22C55E' : '#EF4444' }]}>{(lastBet.pointsEarned || 0) >= 0 ? '+' : ''}{lastBet.pointsEarned} points</Text>
                            </View>
                        )}
                        {crashTriggered && week >= 4 && (
                            <View style={[s.narrBox, { borderLeftColor: '#EF4444' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <AlertTriangle size={16} color="#EF4444" strokeWidth={3} />
                                    <Text style={[s.narrTxt, { fontFamily: Typography.fontFamily.extraBold, marginBottom: 0 }]}>CRASH TRIGGERED</Text>
                                </View>
                                <Text style={[s.narrTxt, { fontFamily: Typography.fontFamily.bold }]}>Market is in freefall!</Text>
                            </View>
                        )}
                        <BouncyButton title={week >= totalWeeks - 1 ? 'See Final Results' : `Continue to Week ${week + 2}`} icon={ChevronRight} onPress={nextWeek} style={{ marginTop: 24 }} />
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    return <View style={s.center}><Text style={s.errTxt}>Unknown phase</Text></View>;
}

// ══════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.xl },
    phaseScroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
    errTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.textMuted },
    linkTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.primary, marginTop: 12 },
    // Intro
    introTag: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: Colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    introTitle: { fontFamily: Typography.fontFamily.black, fontSize: 32, color: Colors.secondary, letterSpacing: -1, lineHeight: 36 },
    introSub: { fontFamily: Typography.fontFamily.bold, fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
    divider: { height: 1, backgroundColor: Colors.inputBorder, marginVertical: 20 },
    sectionLabel: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14, color: Colors.secondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    bodyText: { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
    figureName: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14, color: Colors.secondary },
    figureRole: { color: Colors.textMuted, fontFamily: Typography.fontFamily.bold },
    figureBio: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    capitalText: { fontFamily: Typography.fontFamily.black, fontSize: 36, color: Colors.secondary, marginBottom: 20 },
    riskRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    riskBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.inputBorder, alignItems: 'center' },
    riskBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    riskBtnTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.textMuted },
    riskBtnTxtActive: { color: Colors.primary },
    startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 28, backgroundColor: Colors.primary, gap: 10, marginTop: 10, borderBottomWidth: 4, borderBottomColor: Colors.primaryDark },
    startBtnTxt: { fontFamily: Typography.fontFamily.black, fontSize: 17, color: '#FFF' },
    // Top bar
    topBar: { backgroundColor: Colors.secondary, paddingHorizontal: Spacing.lg, paddingBottom: 10 },
    topBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    topBarWeek: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: '#A1A1AA' },
    topBarRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    tokenBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
    tokenBadgeTxt: { fontFamily: Typography.fontFamily.black, fontSize: 13, color: '#F59E0B' },
    cashBadge: { backgroundColor: '#22C55E20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E' },
    cashBadgeTxt: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: '#22C55E' },
    psychRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    psychItem: { flex: 1 },
    psychLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 9, color: '#A1A1AA', marginBottom: 2, textTransform: 'uppercase' },
    psychBarBg: { height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
    psychBarFill: { height: '100%', borderRadius: 2 },
    dashStrip: { flexDirection: 'row', gap: 4 },
    dashItem: { flex: 1, backgroundColor: '#1E293B', borderRadius: 8, padding: 6, alignItems: 'center' },
    dashLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 9, color: '#64748B', textTransform: 'uppercase' },
    dashVal: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: '#FFF' },
    // Phase common
    phaseTitle: { fontFamily: Typography.fontFamily.black, fontSize: 24, color: Colors.secondary, letterSpacing: -0.5, marginTop: 16 },
    phaseSub: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.textMuted, marginTop: 4 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 26, backgroundColor: Colors.primary, gap: 8, marginTop: 24, borderBottomWidth: 4, borderBottomColor: Colors.primaryDark },
    nextBtnTxt: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: '#FFF' },
    emptyTxt: { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 30 },
    // News
    newsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', borderWidth: 1, borderColor: Colors.inputBorder },
    newsType: { fontFamily: Typography.fontFamily.black, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
    newsText: { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: Colors.secondary, lineHeight: 20 },
    newsDate: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },
    // Investigation
    investigateHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    phaseSubInvestigate: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.primary, marginTop: 4 },
    tokenBadgeDuolingo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 2, borderColor: '#F59E0B40', gap: 6 },
    tokenBadgeTextDuolingo: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: '#F59E0B' },
    sigCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#8B5CF6', borderWidth: 1, borderColor: Colors.inputBorder },
    sigTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    sigCat: { fontFamily: Typography.fontFamily.black, fontSize: 10, color: '#8B5CF6', letterSpacing: 1 },
    sigCost: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted },
    sigTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: Colors.secondary, marginBottom: 4 },
    sigDesc: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
    // Trade
    tradeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.inputBorder },
    tradeName: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14, color: Colors.secondary },
    tradePrice: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.secondary, marginTop: 2 },
    tradePos: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    tradeActions: { flexDirection: 'row', gap: 6 },
    buyBtn: { backgroundColor: '#DCFCE7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderBottomWidth: 3, borderBottomColor: '#16A34A' },
    buyBtnTxt: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: '#16A34A' },
    sellBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderBottomWidth: 3, borderBottomColor: '#DC2626' },
    sellBtnTxt: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: '#DC2626' },
    posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder },
    posName: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.secondary, flex: 1 },
    posQty: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted, marginRight: 12 },
    posPL: { fontFamily: Typography.fontFamily.black, fontSize: 13 },
    // Conviction
    starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
    convNote: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
    predRow: { flexDirection: 'row', gap: 8 },
    predBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.inputBorder, alignItems: 'center' },
    predBtnTxt: { fontFamily: Typography.fontFamily.extraBold, fontSize: 13, color: Colors.textMuted },
    // Resolve
    narrBox: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    narrTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.secondary, marginBottom: 4 },
    retRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder },
    retName: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.secondary, flex: 1 },
    retPrice: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.secondary, marginRight: 12 },
    retPct: { fontFamily: Typography.fontFamily.black, fontSize: 13, width: 60, textAlign: 'right' },
    predResult: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.inputBorder },
    predResultTxt: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.textSecondary },
    predResultScore: { fontFamily: Typography.fontFamily.black, fontSize: 20, marginTop: 6 },
    // Modals
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
    modalCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 24 },
    modalTitle: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary, marginBottom: 8 },
    modalBody: { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
    modalBtn: { height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderBottomWidth: 4, borderBottomColor: Colors.primaryDark },
    modalBtnTxt: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: '#FFF' },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 16 },
    qtyBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
    qtyInput: { width: 80, height: 44, borderWidth: 2, borderColor: Colors.inputBorder, borderRadius: 12, textAlign: 'center', fontFamily: Typography.fontFamily.black, fontSize: 18, color: Colors.secondary },
    tradeCost: { fontFamily: Typography.fontFamily.extraBold, fontSize: 16, color: Colors.secondary, textAlign: 'center' },
});
