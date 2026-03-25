// ─── Types ───────────────────────────────────────────────────────────────────

export interface FlashCard {
    front: string;
    back: string;
}

export interface QuizQuestion {
    q: string;
    options: string[];
    correct: number;
    xp: number;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation: string;
}

export interface Lesson {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    xpReward: number;
    flashcards: FlashCard[];
    quiz: QuizQuestion[];
}

export interface Chapter {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
}

export interface Category {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    description: string;
    chapters: Chapter[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const l = (
    id: string,
    title: string,
    difficulty: 'easy' | 'medium' | 'hard',
    xpReward: number,
    flashcards: FlashCard[],
    quiz: QuizQuestion[]
): Lesson => ({ id, title, difficulty, xpReward, flashcards, quiz });

const ch = (id: string, title: string, description: string, lessons: Lesson[]): Chapter =>
    ({ id, title, description, lessons });

const q = (
    question: string,
    options: string[],
    correct: number,
    xp: number,
    difficulty: 'easy' | 'medium' | 'hard',
    explanation: string
): QuizQuestion => ({ q: question, options, correct, xp, difficulty, explanation });

const f = (front: string, back: string): FlashCard => ({ front, back });

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 1 — PERSONAL FINANCE
// ═══════════════════════════════════════════════════════════════════════════════
const personalFinance: Category = {
    id: 'personal-finance',
    title: 'PERSONAL FINANCE',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    description: 'Stop fumbling the bag. Learn to own your cash flow.',
    chapters: [
        ch('pf-c1', 'Money Basics', 'Understanding what money actually is.', [
            l('pf-c1-l1', 'What Is Money?', 'easy', 40, [
                f('What is money?', 'A universal IOU everyone agrees to trade value with.'),
                f('What is fiat currency?', 'Cash backed by government trust, not gold or silver.'),
            ], [
                q('Money works because:', ['People agree it has value', 'It is made of gold', 'Banks print it daily', 'It never loses value'], 0, 15, 'easy', 'Money is a collective agreement — its value is purely based on shared trust.'),
                q('Fiat currency is backed by:', ['Gold reserves', 'Government trust and law', 'Crypto', 'Oil'], 1, 15, 'easy', 'Fiat money has no intrinsic commodity backing — only government decree.'),
            ]),
            l('pf-c1-l2', 'Inflation & Purchasing Power', 'medium', 50, [
                f('What is inflation?', 'When the general price level rises over time, making each rupee worth less.'),
                f('What is purchasing power?', 'How much you can actually buy with a fixed amount of money.'),
            ], [
                q('If inflation is 6% and your savings earn 4%, your real return is:', ['+10%', '+2%', '-2%', '0%'], 2, 20, 'medium', 'Real return = Nominal return - Inflation. 4 - 6 = -2%. You are losing money in real terms.'),
                q('Inflation hurts people who:', ['Invest in stocks', 'Hold cash under the mattress', 'Own real estate', 'Buy index funds'], 1, 20, 'medium', 'Holding idle cash means inflation erodes its value silently every year.'),
            ]),
        ]),
        ch('pf-c2', 'Budgeting', 'Build a budget that doesn\'t restrict your life but protects it.', [
            l('pf-c2-l1', '50/30/20 Rule', 'easy', 45, [
                f('The 50/30/20 Rule', '50% Needs, 30% Wants, 20% goes into savings and investments.'),
                f('What are "Needs"?', 'Non-negotiable monthly expenses: rent, groceries, bills, transport.'),
            ], [
                q('In the 50/30/20 rule, "Wants" get:', ['50%', '30%', '20%', '10%'], 1, 15, 'easy', '30% is allocated for lifestyle — dining, entertainment, travel.'),
                q('Zero-based budgeting means:', ['Spending nothing', 'Giving every rupee a job until balance is zero', 'Saving 100%', 'Ignoring expenses'], 1, 15, 'easy', 'Every rupee is assigned a purpose — tracking to the last decimal.'),
            ]),
            l('pf-c2-l2', 'Tracking Expenses', 'medium', 50, [
                f('Why track spending?', 'You cannot fix what you cannot see. Tracking exposes invisible leaks.'),
                f('The Latte Factor', 'Small daily purchases (coffee, snacks) add up to massive yearly totals.'),
            ], [
                q('Tracking expenses primarily helps you:', ['Impress friends', 'Know where money escapes unnoticed', 'Qualify for loans', 'Earn more money'], 1, 20, 'medium', 'Awareness is the first step to control. Most people are surprised where cash actually goes.'),
                q('Rs 150 daily on coffee = how much yearly?', ['Rs 5,000', 'Rs 18,000', 'Rs 54,750', 'Rs 1,00,000'], 2, 20, 'medium', '150 x 365 = Rs 54,750 per year just on coffee.'),
            ]),
        ]),
        ch('pf-c3', 'Saving Smart', 'Your savings strategy should work harder than you do.', [
            l('pf-c3-l1', 'Emergency Fund', 'easy', 45, [
                f('What is an emergency fund?', '3-6 months of living expenses stashed in a liquid, accessible account.'),
                f('Where to keep it?', 'High-yield savings account or liquid mutual fund — accessible but separate.'),
            ], [
                q('Ideal emergency fund size is:', ['1 week salary', '1 month rent', '3-6 months of living expenses', 'Rs 10,000 flat'], 2, 15, 'easy', 'You need enough to survive a job loss or crisis without touching investments.'),
                q('Emergency funds should NOT be invested in:', ['Liquid funds', 'High-yield savings', 'Fixed Deposits', 'Volatile stocks'], 3, 15, 'easy', 'Stocks can crash exactly when you need money most. Liquidity is the priority.'),
            ]),
            l('pf-c3-l2', 'Pay Yourself First', 'medium', 55, [
                f('What does "Pay yourself first" mean?', 'Auto-transfer savings before spending a single rupee on anything else.'),
                f('Why automate savings?', 'Willpower fails. Automation ensures savings happen before temptation kicks in.'),
            ], [
                q('The best time to save money is:', ['After monthly expenses are done', 'The moment salary arrives', 'When you get a bonus', 'When you feel like it'], 1, 20, 'medium', 'Saving from what is left never works. Automate it on payday.'),
                q('Automating savings increases saving rates because:', ['Banks offer higher rates', 'It removes the decision entirely', 'It is required by law', 'It earns bonus interest'], 1, 20, 'medium', 'Removing the decision from the equation removes willpower as a bottleneck.'),
            ]),
        ]),
        ch('pf-c4', 'Good vs Bad Debt', 'Not all debt is a villain. Some debt builds wealth.', [
            l('pf-c4-l1', 'Understanding Debt', 'easy', 50, [
                f('Good Debt', 'Borrowed money used for assets that appreciate or generate income (home, education, business).'),
                f('Bad Debt', 'High-interest debt for depreciating or consumed goods — credit cards, lifestyle loans.'),
            ], [
                q('Which is an example of good debt?', ['Credit card for dining', 'Personal loan for a vacation', 'Home loan for a property', 'BNPL for new shoes'], 2, 20, 'easy', 'A home loan builds an asset that can appreciate and generate rental income.'),
                q('Credit card debt is typically bad because:', ['It builds credit score', 'It has very high interest rates (24-48% p.a.)', 'Banks approve it easily', 'It has flexible tenure'], 1, 20, 'easy', 'Unpaid credit card balances compound at brutal rates, trapping people in cycles.'),
            ]),
            l('pf-c4-l2', 'Paying Off Debt', 'medium', 55, [
                f('Snowball Method', 'Pay off smallest debts first. Builds momentum and motivation fast.'),
                f('Avalanche Method', 'Pay off highest-interest debt first. Saves the most money mathematically.'),
            ], [
                q('The avalanche method targets debts by:', ['Smallest balance first', 'Highest interest rate first', 'Newest debt first', 'Largest balance first'], 1, 20, 'medium', 'Attacking high-interest debt first minimizes total interest paid over time.'),
                q('Debt consolidation works by:', ['Increasing your EMIs', 'Combining multiple debts into one lower-interest loan', 'Delaying all payments', 'Adding more credit cards'], 1, 20, 'medium', 'Rolling multiple debts into one simplifies repayment and often lowers interest rate.'),
            ]),
        ]),
        ch('pf-c5', 'Credit Scores', 'Your credit score is your financial reputation. Protect it.', [
            l('pf-c5-l1', 'How Scores Work', 'easy', 45, [
                f('CIBIL Score Range', '300-900. Above 750 is considered excellent and unlocks the best loan rates.'),
                f('What affects it most?', 'Payment history (35%) — one missed EMI can tank your score significantly.'),
            ], [
                q('A CIBIL score above 750 is considered:', ['Average', 'Poor', 'Excellent', 'Invalid'], 2, 15, 'easy', 'Scores above 750 qualify you for the best interest rates from lenders.'),
                q('The most heavily weighted credit factor is:', ['Total income', 'Number of cards', 'Payment history', 'Credit age'], 2, 15, 'easy', 'Paying on time consistently is the single most impactful thing you can do.'),
            ]),
            l('pf-c5-l2', 'Improving Your Score', 'medium', 55, [
                f('Credit Utilization', 'Keep card usage below 30% of your total limit. High utilization tanks scores.'),
                f('Credit Age Matters', 'Older accounts boost your score. Do not close old cards even if unused.'),
            ], [
                q('To protect your credit score, keep utilization below:', ['10%', '30%', '50%', '80%'], 1, 20, 'medium', 'High utilization signals financial stress to lenders and lowers your score.'),
                q('Applying for multiple loans rapidly can:', ['Boost your score', 'Have no effect', 'Temporarily lower your score', 'Delete your credit history'], 2, 20, 'medium', 'Multiple hard inquiries in a short period signal desperation for credit.'),
            ]),
        ]),
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 2 — STOCKS
// ═══════════════════════════════════════════════════════════════════════════════
const stocksCategory: Category = {
    id: 'stocks',
    title: 'STOCKS',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Own real pieces of companies you already use every day.',
    chapters: [
        ch('st-c1', 'Stock Fundamentals', 'The bare minimum before you touch a brokerage app.', [
            l('st-c1-l1', 'What Is a Stock?', 'easy', 40, [
                f('Stock', 'A fractional ownership unit in a publicly listed company.'),
                f('Market Capitalization', 'Total company value = share price × total shares outstanding.'),
            ], [
                q('Owning a stock makes you:', ['A company employee', 'A part-owner (shareholder)', 'A creditor', 'A board member'], 1, 15, 'easy', 'Stocks represent equity — you own a slice of the business and its future profits.'),
                q('Market cap determines:', ['Dividend payout', 'How large a company is in market value', 'Stock price tomorrow', 'CEO salary'], 1, 15, 'easy', 'It is the simplest way to compare company sizes.'),
            ]),
            l('st-c1-l2', 'Bull vs Bear Markets', 'easy', 45, [
                f('Bull Market', 'Rising market — optimism, strong earnings, prices trending up 20%+ from lows.'),
                f('Bear Market', 'Falling market — pessimism, prices dropped 20%+ from recent highs.'),
            ], [
                q('A bear market is defined as a drop of:', ['5% from highs', '10% from highs', '20% or more from highs', '50% from highs'], 2, 15, 'easy', 'A bear market is technically a 20%+ decline from a recent peak.'),
                q('During a bear market the smart move is usually:', ['Panic sell everything', 'Do nothing or keep buying', 'Short every stock', 'Switch to cash only'], 1, 15, 'easy', 'Long-term investors who stay calm through bear markets historically come out ahead.'),
            ]),
        ]),
        ch('st-c2', 'How Markets Work', 'The mechanics behind every trade.', [
            l('st-c2-l1', 'Stock Exchanges', 'easy', 45, [
                f('NSE & BSE', 'India\'s two main stock exchanges where shares are bought and sold.'),
                f('SEBI', 'Securities and Exchange Board of India — regulates and protects investors.'),
            ], [
                q('SEBI\'s primary role is to:', ['Print money', 'Regulate stock markets and protect investors', 'Set loan interest rates', 'Manage government debt'], 1, 15, 'easy', 'SEBI ensures fair markets, prevents fraud, and maintains investor confidence.'),
                q('The NIFTY 50 tracks:', ['50 government bonds', 'Top 50 companies on NSE by market cap', 'Top 50 mutual funds', '50 currency pairs'], 1, 15, 'easy', 'NIFTY 50 is the benchmark index of India\'s largest listed companies.'),
            ]),
            l('st-c2-l2', 'Order Types', 'medium', 55, [
                f('Market Order', 'Buy or sell immediately at the current best available price.'),
                f('Limit Order', 'Execute only at a specific price you set — waits until conditions are met.'),
            ], [
                q('A limit order guarantees:', ['Immediate execution', 'Execution at your specified price or better', 'The best market price', 'Profit'], 1, 20, 'medium', 'Limit orders give you price control — but they may not execute if price never reaches your target.'),
                q('A stop-loss order is used to:', ['Maximize gains', 'Automatically sell if price falls below a threshold', 'Buy at market open', 'Lock in dividends'], 1, 20, 'medium', 'Stop-losses protect capital by auto-selling before losses become catastrophic.'),
            ]),
        ]),
        ch('st-c3', 'Reading Stocks', 'Analyzing whether a stock is worth buying.', [
            l('st-c3-l1', 'P/E Ratio', 'medium', 55, [
                f('Price-to-Earnings (P/E) Ratio', 'Share price divided by earnings per share. Tells you how much you pay per rupee of profit.'),
                f('High P/E vs Low P/E', 'High P/E means growth expectations are priced in. Low P/E may signal undervaluation or concerns.'),
            ], [
                q('A P/E of 50 compared to industry average of 20 suggests the stock is:', ['Undervalued', 'Overvalued or high growth expected', 'Worthless', 'Paying high dividends'], 1, 20, 'medium', 'P/E above industry average means the market expects strong future earnings growth.'),
                q('P/E ratio = Price per share divided by:', ['Dividends per share', 'Book value', 'Earnings per share', 'Revenue per share'], 2, 20, 'medium', 'EPS (Earnings per share) is the denominator in the P/E formula.'),
            ]),
            l('st-c3-l2', 'Dividends', 'medium', 55, [
                f('What is a Dividend?', 'A portion of company profits distributed directly to shareholders, usually quarterly.'),
                f('Dividend Yield', 'Annual dividend per share ÷ share price × 100. Measures income return on investment.'),
            ], [
                q('Dividend yield measures:', ['Total company profits', 'Income return on investment', 'Share price growth', 'Tax on profits'], 1, 20, 'medium', 'It tells you how much passive income you get per rupee invested.'),
                q('Companies that pay high dividends tend to be:', ['New startups', 'High-growth tech companies', 'Mature, stable businesses', 'Government agencies'], 2, 20, 'medium', 'Mature companies with stable cash flow return value via dividends rather than reinvesting all profits.'),
            ]),
        ]),
        ch('st-c4', 'Risk Management', 'Protecting your portfolio from wipeouts.', [
            l('st-c4-l1', 'Diversification', 'medium', 55, [
                f('Diversification', 'Spreading investments across multiple assets, sectors, or regions to limit exposure to any one failure.'),
                f('Correlation', 'Assets with low correlation move independently — combining them reduces overall volatility.'),
            ], [
                q('Diversification helps primarily by:', ['Guaranteeing profits', 'Reducing risk of total portfolio collapse', 'Increasing average returns', 'Avoiding taxes'], 1, 20, 'medium', 'If one stock crashes, diversified portfolios are shielded by other holdings.'),
                q('Putting 100% of capital in one stock is called:', ['Smart concentration', 'Undiversified risk', 'Dollar-cost averaging', 'Hedging'], 1, 20, 'medium', 'Single-stock concentration is extreme risk — one bad event can wipe you out.'),
            ]),
            l('st-c4-l2', 'Volatility', 'hard', 65, [
                f('Volatility', 'How wildly a stock\'s price swings. High volatility = high risk and potential reward.'),
                f('Beta', 'Measures how much a stock moves vs the market. Beta > 1 means more volatile than the index.'),
            ], [
                q('A stock with Beta of 1.5 vs market means:', ['Less volatile than market', 'Moves 50% more than the market', 'Same as market', 'Negative correlation'], 1, 25, 'hard', 'If market moves 10%, a Beta 1.5 stock would move approximately 15%.'),
                q('Volatility is rewarded in the long run because:', ['High risk = guaranteed high return', 'Patient investors get compensated for tolerance of short-term swings', 'Volatile stocks never crash', 'Regulators mandate it'], 1, 25, 'hard', 'Risk premium exists — investors who tolerate more volatility historically earn higher returns.'),
            ]),
        ]),
        ch('st-c5', 'Investing Styles', 'Find the strategy that fits your brain.', [
            l('st-c5-l1', 'Value vs Growth', 'medium', 55, [
                f('Value Investing', 'Buying undervalued stocks trading below their intrinsic worth. Popularized by Warren Buffett.'),
                f('Growth Investing', 'Buying fast-growing companies even at premium valuations, betting on future earnings explosion.'),
            ], [
                q('Warren Buffett is famously associated with:', ['Day trading', 'Value investing', 'Crypto speculation', 'Technical analysis'], 1, 20, 'medium', 'Buffett looks for quality businesses at fair or below-fair prices.'),
                q('Growth stocks typically have:', ['Low P/E ratios', 'High P/E ratios with fast revenue growth', 'High dividends', 'Low market caps'], 1, 20, 'medium', 'Growth investors pay a premium today for expected outsized earnings in the future.'),
            ]),
            l('st-c5-l2', 'Long-Term vs Short-Term', 'hard', 65, [
                f('Day Trading', 'Buying and selling within the same trading day. Extremely high risk and failure rate.'),
                f('Buy and Hold', 'Purchasing quality stocks and holding for years or decades. Proven strategy for wealth creation.'),
            ], [
                q('What percentage of day traders are profitable long-term?', ['70-80%', '50-60%', 'Less than 10%', 'Around 30%'], 2, 25, 'hard', 'Studies consistently show 80-95% of day traders lose money over time.'),
                q('The main advantage of buy-and-hold is:', ['Daily profits', 'Compounding returns and low transaction costs', 'Avoiding taxes entirely', 'Being recession-proof'], 1, 25, 'hard', 'Long holding periods let compounding work, while reducing trading fees and tax drag.'),
            ]),
        ]),
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 3 — INVESTING
// ═══════════════════════════════════════════════════════════════════════════════
const investingCategory: Category = {
    id: 'investing',
    title: 'INVESTING',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'Make your money work overtime while you sleep.',
    chapters: [
        ch('in-c1', 'Mutual Funds', 'The starter pack for beginner investors.', [
            l('in-c1-l1', 'What Are Mutual Funds?', 'easy', 45, [
                f('Mutual Fund', 'A pool of money from many investors, managed by a professional fund manager.'),
                f('NAV', 'Net Asset Value — the price of one unit in a mutual fund, updated daily.'),
            ], [
                q('A mutual fund pools money from:', ['One wealthy investor', 'The government', 'Many investors combined', 'Banks only'], 2, 15, 'easy', 'The collective pool allows small investors to access diversified portfolios at low cost.'),
                q('NAV stands for:', ['Net Annual Value', 'Net Asset Value', 'Nominal Average Value', 'None of the above'], 1, 15, 'easy', 'NAV is the per-unit price of a mutual fund, calculated daily after market close.'),
            ]),
            l('in-c1-l2', 'Active vs Passive Funds', 'medium', 55, [
                f('Active Funds', 'Fund manager tries to beat the market by hand-picking stocks. Higher fees.'),
                f('Passive/Index Funds', 'Blindly mirrors a market index like NIFTY 50. Very low fees, consistently hard to beat.'),
            ], [
                q('Expense ratios are typically lowest in:', ['Actively managed funds', 'Index funds', 'Hedge funds', 'ULIP funds'], 1, 20, 'medium', 'Index funds just replicate an index mechanically — no expensive research or managers needed.'),
                q('Over 10+ years, most active funds:', ['Beat the index easily', 'Consistently destroy index funds', 'Underperform their benchmark index', 'Have zero expenses'], 2, 20, 'medium', 'Data shows 80-90% of active funds fail to beat their index over long periods after fees.'),
            ]),
        ]),
        ch('in-c2', 'SIP Strategy', 'Consistent small investments beat one-time lump sums.', [
            l('in-c2-l1', 'How SIPs Work', 'easy', 45, [
                f('SIP (Systematic Investment Plan)', 'Investing a fixed amount in a mutual fund every month automatically.'),
                f('Rupee Cost Averaging', 'SIPs buy more units when markets are low and fewer when high — smoothing out volatility.'),
            ], [
                q('SIPs help most when markets are:', ['Only rising', 'Highly volatile', 'Completely flat', 'Closed'], 1, 15, 'easy', 'Volatility actually benefits SIP investors through rupee cost averaging — they buy more at lower prices.'),
                q('Rs 5,000/month SIP for 20 years at 12% returns gives approximately:', ['Rs 12 Lakhs', '₹50 Lakhs', '₹2 Crores', '₹5 Lakhs'], 2, 15, 'easy', 'Compounding over 20 years turns ₹12L of invested capital into approximately ₹2 Crore.'),
            ]),
            l('in-c2-l2', 'Choosing the Right SIP', 'medium', 55, [
                f('ELSS Funds', 'Equity Linked Savings Scheme. Offers 80C tax deduction up to ₹1.5 Lakh. 3 year lock-in.'),
                f('Large Cap vs Small Cap', 'Large cap = stable blue chips. Small cap = high growth potential, high volatility.'),
            ], [
                q('ELSS funds have a minimum lock-in of:', ['1 year', '3 years', '5 years', '10 years'], 1, 20, 'medium', 'The 3-year lock-in is the shortest among all 80C tax-saving instruments.'),
                q('Small cap funds are best for investors with:', ['Low risk tolerance', 'Long time horizons and high risk appetite', 'Retirement tomorrow', 'Monthly income needs'], 1, 20, 'medium', 'Small caps need time to grow and can be volatile — long horizons let them compound.'),
            ]),
        ]),
        ch('in-c3', 'Compounding', 'The 8th wonder of the world. Literally Einstein\'s words.', [
            l('in-c3-l1', 'Power of Compounding', 'easy', 50, [
                f('Compound Interest', 'Earning returns on your principal AND on previously earned returns. Growth accelerates over time.'),
                f('Rule of 72', 'Divide 72 by your annual return rate to estimate years needed to double your money.'),
            ], [
                q('At 9% annual return, money doubles in approximately:', ['4 years', '8 years', '12 years', '16 years'], 1, 15, 'easy', 'Rule of 72: 72÷9 = 8 years to double.'),
                q('Compounding is most powerful when:', ['You withdraw frequently', 'You start early and stay invested long', 'Returns are taxed at 100%', 'You invest only large lump sums'], 1, 15, 'easy', 'Time is the key variable in compounding — early starters gain exponential advantage.'),
            ]),
            l('in-c3-l2', 'Starting Early', 'medium', 55, [
                f('Time in Market', 'An investor who starts at 22 vastly outperforms one who starts at 32 with same monthly amount.'),
                f('Opportunity Cost of Delay', 'Every year you delay investing is compounding growth permanently lost.'),
            ], [
                q('Starting investing 10 years earlier generally results in:', ['Same wealth', 'Roughly doubled or more final wealth', 'Slightly more', 'Less due to risk'], 1, 20, 'medium', 'Early years contribute disproportionately because those rupees compound for the longest time.'),
                q('Waiting for the "perfect time" to invest usually results in:', ['Maximum returns', 'Missing significant market gains', 'Lower risk', 'Better entry prices'], 1, 20, 'medium', 'Time in market consistently beats timing the market for long-term investors.'),
            ]),
        ]),
        ch('in-c4', 'Alternative Assets', 'Beyond stocks and fixed deposits.', [
            l('in-c4-l1', 'Gold & REITs', 'medium', 55, [
                f('Gold as Hedge', 'Gold typically rises during economic crises and inflation — a safe haven asset.'),
                f('REIT (Real Estate Investment Trust)', 'Buy shares of large commercial properties on stock exchange. Earn rental income without owning property.'),
            ], [
                q('Gold is most valuable in a portfolio as:', ['Primary growth asset', 'An inflation and crisis hedge', 'A dividend payer', 'A short-term trade'], 1, 20, 'medium', 'Gold does not generate income but preserves value during turmoil and inflation.'),
                q('REITs must distribute at least what % of income to investors?', ['10%', '50%', '90%', '100%'], 2, 20, 'medium', 'REITs are required to distribute 90%+ of rental income as dividends — making them income-generating.'),
            ]),
            l('in-c4-l2', 'Bonds', 'medium', 55, [
                f('Bond', 'A loan you give to government or companies. They pay fixed interest and return principal at maturity.'),
                f('Inverse Relationship', 'When interest rates rise, bond prices fall. When rates fall, bond prices rise.'),
            ], [
                q('A bond gives you:', ['Ownership of the company', 'Fixed periodic interest payments', 'Voting rights', 'Dividend payments'], 1, 20, 'medium', 'Bonds are debt instruments — you lend money and receive coupon payments in return.'),
                q('When RBI raises interest rates, existing bond prices:', ['Rise', 'Stay the same', 'Fall', 'Double'], 2, 20, 'medium', 'New bonds offer higher rates, making older lower-rate bonds less attractive, lowering their price.'),
            ]),
        ]),
        ch('in-c5', 'Portfolio Building', 'Putting it all together like a pro.', [
            l('in-c5-l1', 'Asset Allocation', 'medium', 60, [
                f('Asset Allocation', 'Deciding what percentage of your portfolio goes into stocks, bonds, and other assets.'),
                f('100 Minus Age Rule', 'Simple rule: subtract your age from 100 to get target equity percentage. Rest in bonds.'),
            ], [
                q('For a 25-year-old, the 100 minus age rule suggests what equity allocation?', ['25%', '50%', '75%', '100%'], 2, 20, 'medium', '100 - 25 = 75% in equities, 25% in safer assets like bonds.'),
                q('Asset allocation primarily manages:', ['Tax liability', 'Risk vs return balance over time', 'Fund manager selection', 'Dividend timing'], 1, 20, 'medium', 'Allocating across uncorrelated assets smooths out portfolio volatility significantly.'),
            ]),
            l('in-c5-l2', 'Rebalancing', 'hard', 70, [
                f('Portfolio Rebalancing', 'Periodically restoring original target allocation after markets shift the ratios.'),
                f('When to Rebalance', 'Annually or when any asset class drifts more than 5-10% from target.'),
            ], [
                q('Rebalancing involves:', ['Only buying more stocks', 'Selling well-performing assets and buying underperformers to restore targets', 'Closing the portfolio', 'Adding new asset classes'], 1, 25, 'hard', 'You systematically sell what grew (taking profit) and buy what lagged (buying low).'),
                q('Without rebalancing, over time a 60/40 portfolio may drift to:', ['Stay at 60/40 forever', '80/20 stocks-to-bonds during a bull run', '0/100 in stocks', '100/0 in bonds'], 1, 25, 'hard', 'Equities outperform over time, increasing their portfolio share if not periodically trimmed.'),
            ]),
        ]),
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 4 — TAXES & DEBT
// ═══════════════════════════════════════════════════════════════════════════════
const taxesDebtCategory: Category = {
    id: 'taxes-debt',
    title: 'TAXES & DEBT',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    description: 'Keep more of what you earn. Legally.',
    chapters: [
        ch('td-c1', 'Tax Basics', 'The system demystified.', [
            l('td-c1-l1', 'Income Tax Slabs', 'easy', 45, [
                f('Progressive Tax', 'Higher income = higher tax rate, but only on the portion above each threshold.'),
                f('New vs Old Tax Regime', 'New regime has lower rates but fewer deductions. Old regime allows Section 80C, HRA, etc.'),
            ], [
                q('In a progressive tax system, earning ₹15 Lakh means:', ['All ₹15L taxed at the top rate', 'Only the income above each slab threshold is taxed at that rate', 'You pay zero tax', 'Tax is flat at 30%'], 1, 15, 'easy', 'Progressive systems tax only the portion within each slab at that slab\'s rate.'),
                q('The standard deduction for salaried employees is:', ['₹50,000', '₹75,000', '₹1,50,000', 'Not applicable'], 0, 15, 'easy', 'Salaried individuals get an automatic ₹50,000 deduction before computing taxable income.'),
            ]),
            l('td-c1-l2', 'TDS & Advance Tax', 'medium', 55, [
                f('TDS (Tax Deducted at Source)', 'Tax withheld directly from your salary, interest, or payments before you receive them.'),
                f('Advance Tax', 'Paying taxes in installments during the year instead of a lump sum at year end.'),
            ], [
                q('TDS is deducted:', ['Annually by you', 'At source before income reaches you', 'Only on dividends', 'When you file returns'], 1, 20, 'medium', 'TDS is a withholding mechanism — income is pre-taxed before it hits your account.'),
                q('Advance tax is required when your tax liability exceeds:', ['₹5,000', '₹10,000', '₹20,000', '₹1,00,000'], 1, 20, 'medium', 'If tax owed after TDS exceeds ₹10,000, you must pay advance tax in 4 installments.'),
            ]),
        ]),
        ch('td-c2', 'Tax Saving', 'Legal ways to slash your tax bill.', [
            l('td-c2-l1', 'Section 80C', 'easy', 50, [
                f('Section 80C', 'Deduct up to ₹1.5 Lakh from taxable income by investing in PPF, ELSS, LIC, EPF, NSC.'),
                f('PPF (Public Provident Fund)', 'Government-backed 15-year investment with 7-8% tax-free returns. Entire investment is under 80C.'),
            ], [
                q('Maximum deduction under Section 80C is:', ['₹50,000', '₹1,00,000', '₹1,50,000', '₹3,00,000'], 2, 15, 'easy', 'The ₹1.5 Lakh cap under 80C covers multiple eligible instruments combined.'),
                q('PPF returns are:', ['Fully taxable', 'Partially taxable', 'Tax-free (EEE status)', 'Taxed at 10%'], 2, 15, 'easy', 'PPF is EEE — Exempt at investment, accumulation, and maturity stages.'),
            ]),
            l('td-c2-l2', 'HRA & Other Deductions', 'medium', 55, [
                f('HRA (House Rent Allowance)', 'Salaried employees can claim HRA exemption based on actual rent paid, salary, and city.'),
                f('80D (Health Insurance)', 'Deduction up to ₹25,000 for self+family health insurance premium. ₹50,000 for senior citizens.'),
            ], [
                q('HRA exemption can be claimed when:', ['You own a home', 'You pay rent and receive HRA in salary', 'You work from home', 'You have a home loan'], 1, 20, 'medium', 'HRA is exclusively for those who rent accommodation and receive HRA as part of salary.'),
                q('Section 80D covers:', ['Home loan interest', 'Health insurance premiums', 'Education fees', 'Car loans'], 1, 20, 'medium', '80D is specifically for medical insurance premiums for self, family, and parents.'),
            ]),
        ]),
        ch('td-c3', 'Capital Gains Tax', 'Tax on your investment profits.', [
            l('td-c3-l1', 'STCG vs LTCG', 'medium', 60, [
                f('Short-Term Capital Gains (STCG)', 'Profit from equity held less than 1 year — taxed at flat 15%.'),
                f('Long-Term Capital Gains (LTCG)', 'Profit from equity held over 1 year — taxed at 10% above ₹1 Lakh gain per year.'),
            ], [
                q('To qualify for LTCG on equity, you must hold for at least:', ['6 months', '1 year', '2 years', '3 years'], 1, 20, 'medium', 'Equity (stocks and equity mutual funds) held over 12 months gets LTCG treatment.'),
                q('LTCG on equity above ₹1 Lakh is taxed at:', ['0%', '10%', '15%', '20%'], 1, 20, 'medium', 'Gains up to ₹1 Lakh per year are totally exempt; above that, 10% LTCG applies.'),
            ]),
            l('td-c3-l2', 'Tax Harvesting', 'hard', 65, [
                f('Tax Loss Harvesting', 'Selling losing positions to book capital losses, which can offset gains and reduce tax.'),
                f('Tax Gain Harvesting', 'Booking up to ₹1 Lakh of LTCG annually tax-free by selling and rebuying — resetting cost basis.'),
            ], [
                q('You book ₹80,000 in LTCG this year. Tax payable is:', ['₹8,000', '₹12,000', '₹0', '₹80,000'], 2, 25, 'hard', 'The first ₹1 Lakh of LTCG per year is completely exempt from tax.'),
                q('Tax harvesting gains by selling and rebuying does what?', ['Eliminates tax forever', 'Resets cost basis upward, reducing future taxable gains', 'Is illegal', 'Increases risk'], 1, 25, 'hard', 'Re-buying at a higher price raises your acquisition cost, reducing future capital gains.'),
            ]),
        ]),
        ch('td-c4', 'Managing Loans', 'Not all debt is created equal.', [
            l('td-c4-l1', 'EMI and Interest', 'easy', 45, [
                f('EMI (Equated Monthly Installment)', 'Fixed monthly payment that covers both principal and interest on a loan.'),
                f('Amortization', 'Initially most of your EMI is interest. Over time, more goes toward principal.'),
            ], [
                q('In early EMIs, most of the payment goes toward:', ['Principal', 'Interest', '50/50 split', 'Bank fees'], 1, 15, 'easy', 'Front-loaded interest means the bank recoups interest first — principal repayment accelerates later.'),
                q('Prepaying a loan early is beneficial because:', ['Bank charges more', 'It reduces total interest paid over the loan tenure', 'EMI increases', 'Credit score drops'], 1, 15, 'easy', 'Reducing principal faster means less interest accrues on the remaining balance.'),
            ]),
            l('td-c4-l2', 'Loan Against Assets', 'medium', 55, [
                f('Loan Against MF/Stocks', 'Pledge your investments as collateral and borrow up to 50-80% of value at lower interest.'),
                f('Line of Credit', 'A pre-approved borrowing limit you draw from as needed and repay flexibly.'),
            ], [
                q('Loan against mutual funds is attractive because:', ['No interest charged', 'Lower rate than personal loans and no need to sell investments', 'Investments are sold and returned later', 'Only available above age 60'], 1, 20, 'medium', 'You maintain market exposure while accessing liquidity — no selling means no capital gains tax.'),
                q('Which is typically the cheapest form of borrowing in India?', ['Credit card', 'Personal loan', 'Home loan', 'Gold loan'], 2, 20, 'medium', 'Home loans are secured by property and so carry the lowest interest rates — often 8-10% p.a.'),
            ]),
        ]),
        ch('td-c5', 'Financial Protection', 'Insurance is not an expense — it\'s protection against ruin.', [
            l('td-c5-l1', 'Term Life Insurance', 'easy', 50, [
                f('Term Insurance', 'Pure life cover for a fixed period. High coverage at very low premiums. No investment component.'),
                f('Cover Amount Rule', 'Minimum cover = 10-12x your annual income. More if you have dependents or large debts.'),
            ], [
                q('Term insurance is best for:', ['Investing and insurance together', 'Pure, maximum life protection at low cost', 'Tax savings only', 'Senior citizens'], 1, 15, 'easy', 'Term insurance gives maximum coverage per rupee of premium — no investment mixing.'),
                q('ULIP (insurance + investment hybrid) is generally:', ['Better than pure term + separate investing', 'Inferior due to high charges and complex structure', 'Recommended by financial experts', 'Tax-free at all stages'], 1, 15, 'easy', 'ULIPs suffer from high cost structures — better to keep insurance and investment separate.'),
            ]),
            l('td-c5-l2', 'Health Insurance', 'medium', 55, [
                f('Family Floater Plan', 'One policy covers the entire family. Premium is based on the oldest member\'s age.'),
                f('Adequate Cover', 'Minimum ₹10-15 Lakh health cover per family in metro cities, given medical inflation rates.'),
            ], [
                q('Medical inflation in India runs at approximately:', ['3-4% per year', '7-10% per year', '15-20% per year', '0% (fixed)'], 1, 20, 'medium', 'Healthcare costs in India rise 10-15% annually — today\'s ₹5L cover will be woefully inadequate in 10 years.'),
                q('A waiting period in health insurance means:', ['Delayed premium payments', 'Specific illnesses not covered until after a set period', 'Policy inactive till premium is paid', 'Claim is rejected always'], 1, 20, 'medium', 'Most plans have 2-4 year waiting periods for pre-existing conditions — buy early before you fall sick.'),
            ]),
        ]),
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 5 — WEALTH
// ═══════════════════════════════════════════════════════════════════════════════
const wealthCategory: Category = {
    id: 'wealth',
    title: 'WEALTH',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    description: 'Generational wealth and financial freedom — the final boss level.',
    chapters: [
        ch('w-c1', 'Passive Income', 'Money that earns itself.', [
            l('w-c1-l1', 'Types of Passive Income', 'medium', 60, [
                f('Passive Income', 'Money earned with minimal ongoing effort: dividends, rent, royalties, affiliate income.'),
                f('Active vs Passive', 'Active trading time for money. Passive: asset does the work — you just hold it.'),
            ], [
                q('Which of these is truly passive income?', ['Freelance design work', 'Index fund dividends', 'Overtime salary', 'Uber driving'], 1, 20, 'medium', 'Dividends flow in without ongoing effort once invested — fully passive by definition.'),
                q('Building passive income primarily requires upfront:', ['Luck', 'Time or money investment to build the asset', 'A government license', 'Age 60+'], 1, 20, 'medium', 'Passive income isn\'t free — it demands capital deployment or significant time up front.'),
            ]),
            l('w-c1-l2', 'Dividend Investing', 'hard', 65, [
                f('Dividend Investing Strategy', 'Building a portfolio of dividend-paying stocks to generate regular passive income.'),
                f('DRIP (Dividend Reinvestment Plan)', 'Auto-reinvesting dividends to buy more shares — accelerating compounding.'),
            ], [
                q('DRIP accelerates wealth by:', ['Giving cash every quarter', 'Reinvesting dividends to buy more shares that pay more dividends', 'Reducing tax', 'Increasing volatility'], 1, 25, 'hard', 'Reinvested dividends buy more dividend-paying shares — creating a self-fueling compounding loop.'),
                q('A dividend yield of 4% on ₹10 Lakh investment gives annual income of:', ['₹40,000', '₹4,000', '₹4,00,000', '₹1,000'], 0, 25, 'hard', '4% of ₹10,00,000 = ₹40,000 per year in passive dividend income.'),
            ]),
        ]),
        ch('w-c2', 'Real Estate', 'Bricks and mortar as wealth vehicles.', [
            l('w-c2-l1', 'Real Estate Fundamentals', 'medium', 60, [
                f('Leverage in Real Estate', 'Using a home loan to control a ₹1 Crore property with only ₹20 Lakhs of your own money.'),
                f('Rental Yield', 'Annual rent ÷ property value × 100. Average India yields are 2-3% — capital appreciation is the real play.'),
            ], [
                q('The main wealth driver in Indian real estate is typically:', ['High rental yields', 'Capital appreciation of property price', 'Tax-free status', 'REITs only'], 1, 20, 'medium', 'Rental yields in India are low — most returns come from property price appreciation over time.'),
                q('Real estate leverage means you benefit from appreciation on:', ['Only your down payment', 'The full property value including bank\'s money', 'Nothing — bank owns it', 'Only rental income'], 1, 20, 'medium', 'Even though the bank lent 80%, you keep 100% of price appreciation. That\'s the power of leverage.'),
            ]),
            l('w-c2-l2', 'REITs vs Direct Property', 'hard', 70, [
                f('REIT', 'Real Estate Investment Trust. Buy shares of commercial buildings (offices, malls) on stock exchange.'),
                f('REITs vs Property', 'REITs: liquid, low capital, diversified. Direct property: illiquid, high capital, control.'),
            ], [
                q('One key advantage of REITs over direct real estate is:', ['No tax', 'Liquidity — you can sell in seconds', 'Higher rental yield', 'Guaranteed appreciation'], 1, 25, 'hard', 'Direct property can take months or years to sell. REITs trade on exchange just like stocks.'),
                q('REITs in India are required to distribute at least what % of income?', ['50%', '70%', '90%', '100%'], 2, 25, 'hard', 'Indian REITs must distribute 90%+ of net distributable cash flow — making them high-income assets.'),
            ]),
        ]),
        ch('w-c3', 'Financial Independence', 'Escaping the paycheck-to-paycheck cycle for good.', [
            l('w-c3-l1', 'F.I.R.E. Movement', 'medium', 65, [
                f('FIRE', 'Financial Independence, Retire Early. Save aggressively (50-70% of income) then live off portfolio.'),
                f('FIRE Number', 'Annual expenses × 25. At this corpus, 4% annual withdrawal is sustainable indefinitely.'),
            ], [
                q('If you spend ₹6 Lakhs per year, your FIRE number is:', ['₹60 Lakhs', '₹1 Crore', '₹1.5 Crores', '₹3 Crores'], 2, 20, 'medium', '₹6L × 25 = ₹1.5 Crore. At this corpus, a 4% withdrawal covers expenses without depleting capital.'),
                q('The 4% rule is based on:', ['Bank FD rates', 'Research showing 4% annual withdrawal is safe for 30+ years', 'RBI guidelines', 'Average property yield'], 1, 20, 'medium', 'The Trinity Study showed 4% annual withdrawal historically sustains portfolios over 30 years.'),
            ]),
            l('w-c3-l2', 'Savings Rate Matters Most', 'hard', 70, [
                f('Savings Rate', 'The percentage of income saved. Higher rate = faster path to financial independence.'),
                f('50% savings rate', 'Saving half your income means 1 year of work funds 1 year of expenses — retire in ~17 years.'),
            ], [
                q('Increasing your savings rate from 10% to 50% primarily affects:', ['Your returns', 'Time to financial independence (dramatically shortens it)', 'No effect', 'Risk exposure'], 1, 25, 'hard', 'Savings rate is the lever with the most impact — more than investment returns — on reaching FI.'),
                q('At a 75% savings rate, you can potentially retire in roughly:', ['30 years', '20 years', '7 years', '40 years'], 2, 25, 'hard', 'At 75% savings rate, you save 3× what you spend — reaching financial independence in ~7 years.'),
            ]),
        ]),
        ch('w-c4', 'Behavioral Finance', 'Your own brain is your biggest investment risk.', [
            l('w-c4-l1', 'Cognitive Biases', 'medium', 60, [
                f('Loss Aversion', 'The pain of losing ₹100 feels 2x more intense than the joy of gaining ₹100. Causes panic selling.'),
                f('Confirmation Bias', 'Seeking only information that confirms what you already believe about a stock.'),
            ], [
                q('Loss aversion causes investors to:', ['Hold winners too long', 'Sell losers too quickly out of emotional pain', 'Diversify correctly', 'Buy at lows confidently'], 1, 20, 'medium', 'The emotional pain of losses drives irrational early selling — locking in losses unnecessarily.'),
                q('Confirmation bias leads to:', ['Better research', 'Ignoring warning signs about stocks you already own', 'More diversification', 'Lower risk'], 1, 20, 'medium', 'We subconsciously filter information to protect our existing beliefs — dangerous in investing.'),
            ]),
            l('w-c4-l2', 'Market Psychology', 'hard', 70, [
                f('FOMO (Fear of Missing Out)', 'Buying near market peaks because everyone else is making money. Classic way to buy high.'),
                f('Capitulation', 'Panic-selling everything at market bottoms out of despair. Classic way to lock in losses.'),
            ], [
                q('When taxi drivers and barbers are giving stock tips, it usually signals:', ['Great time to buy more', 'Market is likely at peak — extreme FOMO is a sell signal', 'Government will intervene', 'Market has bottomed'], 1, 25, 'hard', 'When retail euphoria is peak, smart money is usually selling. Retail FOMO marks tops.'),
                q('The best investor strategy during a market crash is typically:', ['Sell everything', 'Ignore news and continue SIPs', 'Shift to gold only', 'Stop investing entirely'], 1, 25, 'hard', 'Crashes are opportunities for long-term investors — continuing SIPs buys more units at lower prices.'),
            ]),
        ]),
        ch('w-c5', 'Legacy & Estate Planning', 'Building wealth that outlasts you.', [
            l('w-c5-l1', 'Will & Nomination', 'medium', 60, [
                f('Will', 'A legal document specifying how your assets should be distributed after death.'),
                f('Nomination', 'Designating who receives insurance, bank, and investment account assets directly — bypasses probate.'),
            ], [
                q('Without a will, your assets are distributed by:', ['Friends and family by consensus', 'Government inheritance laws', 'Nominee automatically', 'Your employer'], 1, 20, 'medium', 'Intestate succession laws determine distribution without a will — often not in line with your wishes.'),
                q('Updating nomination is important after:', ['Marriage', 'Having children', 'Death of old nominee', 'All of the above'], 3, 20, 'medium', 'Life events require nomination to be updated — outdated nominations lead to legal complications.'),
            ]),
            l('w-c5-l2', 'Generational Wealth', 'hard', 75, [
                f('Generational Wealth', 'Financial assets passed down that give descendants a head start — education, property, investments.'),
                f('Inheritance Tax in India', 'India currently has no estate or inheritance tax — assets transfer to heirs largely tax-free.'),
            ], [
                q('The most impactful generational wealth transfer is typically:', ['Cash in a bank account', 'Teaching financial literacy to children', 'Buying luxury goods', 'Paying only for education'], 1, 25, 'hard', 'Wealth without knowledge is lost within 1-2 generations. Financial literacy compounds across lifetimes.'),
                q('India currently has:', ['50% estate tax', '20% inheritance tax', 'No inheritance/estate tax', '10% wealth tax'], 2, 25, 'hard', 'India abolished estate duty in 1985 — assets currently pass to legal heirs without inheritance tax.'),
            ]),
        ]),
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════════
export const LEARN_MODULES: Category[] = [
    personalFinance,
    stocksCategory,
    investingCategory,
    taxesDebtCategory,
    wealthCategory,
];

export const getTotalLessons = (): number =>
    LEARN_MODULES.reduce((sum, cat) =>
        sum + cat.chapters.reduce((cSum, ch) => cSum + ch.lessons.length, 0), 0);

export const getTotalPossibleXP = (): number =>
    LEARN_MODULES.reduce((sum, cat) =>
        sum + cat.chapters.reduce((cSum, ch) =>
            cSum + ch.lessons.reduce((lSum, l) => lSum + l.xpReward, 0), 0), 0);

export const getAllLessonsFlat = (): (Lesson & {
    categoryId: string; categoryTitle: string; categoryColor: string;
    chapterId: string; chapterTitle: string;
})[] => {
    const result: (Lesson & {
        categoryId: string; categoryTitle: string; categoryColor: string;
        chapterId: string; chapterTitle: string;
    })[] = [];
    for (const cat of LEARN_MODULES) {
        for (const chapter of cat.chapters) {
            for (const lesson of chapter.lessons) {
                result.push({
                    ...lesson,
                    categoryId: cat.id, categoryTitle: cat.title, categoryColor: cat.color,
                    chapterId: chapter.id, chapterTitle: chapter.title,
                });
            }
        }
    }
    return result;
};
