/**
 * MY ONLY FRAGRANCE 財務計算の規定値（実数データに基づく）
 * 経費から代表の年収1億まで、一貫した数値で管理。
 * 社長が「この仕組みなら自分も1億稼げるし、会社も安泰だ」と確信できる「なめられない数字」を厳守。
 */

/** 商品単価（円）— 基準。セット購入時は客単価がこれを上回る */
export const UNIT_PRICE_BASE = 6500;

/** 商品原価率（フレグランス業界標準 20〜25% の中央）→ 粗利率 = 1 - 原価率 */
export const COGS_RATE = 0.23;
export const GROSS_MARGIN_RATE = (1 - COGS_RATE) * 100; // 77

// ========== 正社員人件費（内訳明確化） ==========
/** 正社員: 基本月給（円） */
export const FULLTIME_MONTHLY_SALARY = 270000;
/** 正社員: 交通費（円/月） */
export const FULLTIME_MONTHLY_TRANSPORT = 16000;
/** 賞与・法定福利費を含めた企業負担の人件費単価（円/人月）。年2回賞与＋社会保険料を按分して月額に換算。 */
export const FULLTIME_COST_PER_MONTH = 370000;
/** 万円換算（表示用） */
export const FULLTIME_COST_PER_MONTH_MAN = Math.round(FULLTIME_COST_PER_MONTH / 10000); // 37
/** 人件費の根拠ラベル（表・注釈用） */
export const LABOR_SOURCE_NOTE = "Source: 月給27万+諸手当・賞与按分 🔗";

/** アルバイト時給（円）— 店舗所在地に応じた加重平均に用いる */
export const PARTTIME_HOURLY_KYOTO = 1150;
export const PARTTIME_HOURLY_KANTO = 1250;

/** 店舗経費: 消耗品等。営業利益率28.5%になるよう逆算。 */
export const STORE_EXPENSE_RATIO_SUPPLIES = 0.025;
export const STORE_EXPENSE_RATIO_UNIFORM = 0.003;
/** 家賃: 売上比。営業利益率28.5%になるよう逆算。 */
export const STORE_RENT_RATIO = 0.20;
/** 光熱費: 店舗あたり固定（万円/月）。14店舗合計で営業利益率28.5%前後になるよう逆算。 */
export const STORE_UTILITY_MAN = 8;
/** 店舗経費（家賃・光熱費除く）合計比率 */
export const STORE_EXPENSE_RATIO_TOTAL =
  STORE_EXPENSE_RATIO_SUPPLIES + STORE_EXPENSE_RATIO_UNIFORM;

/** 人件費: 売上比。営業利益率28.5%（14店舗合計で月間約3,800万円利益）になるよう逆算。 */
export const STORE_LABOR_RATIO = 0.25;

/** 現場（店舗スタッフ）の採用費: 0円（ブランド力による自社応募）。採用内製化による削減額は本部の戦略的人材投資の原資に充当。 */
export const RECRUITMENT_COST_MAN = 0;
/** 業界想定のエージェント手数料率（売上比）。採用内製化（自社媒体・SNS）により回避した額＝コスト削減額（月換算）の算出に使用。 */
export const TYPICAL_RECRUITMENT_COST_RATIO = 0.01;

/** 棚卸資産: 売上に対する想定比率（月末時点） */
export const INVENTORY_TO_SALES_RATIO = 0.06;

// ========== 本部人件費（Fixed Costs）— 役員・部長・SV 規定報酬＋法定福利費 ==========
/** 法定福利費率（社会保険料等・会社負担）。経費を漏らさない精度で算入。 */
export const HQ_SOCIAL_INSURANCE_RATE = 0.15;

/** 代表取締役（CEO）: 年収1億円 → 月額報酬（万円） */
export const CEO_ANNUAL_JPY = 100_000_000;
export const CEO_MONTHLY_MAN = Math.round(CEO_ANNUAL_JPY / 12 / 10_000); // 833
/** 代表: 会社負担（報酬＋法定福利費15%）（万円/月） */
export const CEO_TOTAL_COST_MAN = Math.round(CEO_MONTHLY_MAN * (1 + HQ_SOCIAL_INSURANCE_RATE)); // 958

/** 事業部長（Director）: 年収1,000万円 → 月額報酬（万円） */
export const HQ_DIRECTOR_ANNUAL_JPY = 10_000_000;
export const HQ_DIRECTOR_MONTHLY_MAN = Math.round(HQ_DIRECTOR_ANNUAL_JPY / 12 / 10_000); // 83
/** 事業部長1名あたり 会社負担（報酬＋法定福利費15%）（万円/月） */
export const HQ_DIRECTOR_TOTAL_COST_MAN = Math.round(HQ_DIRECTOR_MONTHLY_MAN * (1 + HQ_SOCIAL_INSURANCE_RATE)); // 96
export const HQ_DIRECTOR_COUNT = 1;

/** SV（Supervisor）: 年収700万円 → 月額報酬（万円） */
export const HQ_SV_ANNUAL_JPY = 7_000_000;
export const HQ_SV_MONTHLY_MAN = Math.round(HQ_SV_ANNUAL_JPY / 12 / 10_000); // 58
/** SV1名あたり 会社負担（報酬＋法定福利費15%）（万円/月） */
export const HQ_SV_TOTAL_COST_MAN = Math.round(HQ_SV_MONTHLY_MAN * (1 + HQ_SOCIAL_INSURANCE_RATE)); // 67
export const HQ_SV_COUNT = 3;

/** 本部経費合計（万円/月）= 代表＋事業部長＋SV（いずれも報酬＋法定福利費込み）。 */
export const HQ_TOTAL_EXPENSE_MAN =
  CEO_TOTAL_COST_MAN + HQ_DIRECTOR_TOTAL_COST_MAN * HQ_DIRECTOR_COUNT + HQ_SV_TOTAL_COST_MAN * HQ_SV_COUNT;

/** 本部経費の根拠ラベル（表・注釈用） */
export const HQ_SOURCE_NOTE = "Source: 役員・部長・SV 規定報酬 🔗";

/** 本部広告費（万円/月）。全社純利益シミュレーションで按分。 */
export const ADVERTISING_EXPENSE_MAN = 500;

/** 最終純利益（Real Net Profit）目標: 本部人件費を全て差し引いた後、月間 1,500万円前後のキャッシュが残る（万円/月） */
export const TARGET_NET_PROFIT_MAN = 1500;

/**
 * 店舗利益 = 粗利 - 人件費 - 店舗経費。粗利率75〜80%（現状77%）で高付加価値体験を最大化。
 */
export const STORE_PROFIT_MARGIN_RATIO =
  1 - COGS_RATE - STORE_LABOR_RATIO - STORE_EXPENSE_RATIO_TOTAL; // 0.437
export const TARGET_STORE_PROFIT_MAN = TARGET_NET_PROFIT_MAN + HQ_TOTAL_EXPENSE_MAN;
/** 全社月商合計（万円）。14店舗合計で表・グラフに反映。 */
export const TARGET_TOTAL_SALES_MAN = 13500;

// ========== 戦略的採用コスト（One-time Recruiting Cost） ==========
/** 事業部長（Director）採用費: 年収1,000万円の35%を一括計上（ビズリーチ経由）。 */
export const DIRECTOR_RECRUITMENT_FEE_RATIO = 0.35;
export const DIRECTOR_RECRUITMENT_FEE_JPY = Math.round(HQ_DIRECTOR_ANNUAL_JPY * DIRECTOR_RECRUITMENT_FEE_RATIO); // 350万
export const DIRECTOR_RECRUITMENT_FEE_MAN = Math.round(DIRECTOR_RECRUITMENT_FEE_JPY / 10_000); // 350
/** 採用費の根拠ラベル（表・注釈用） */
export const BIZREACH_RECRUITMENT_SOURCE_NOTE = "Source: BizReach Recruitment Fee 🔗";
/** このOSによる経費削減・アップセル施策による投資回収目安（ヶ月）。ROI 100% = 回収完了。 */
export const DIRECTOR_RECRUITMENT_PAYBACK_MONTHS = 2.5;

// ========== Cash Runway（生存期間）・年商200億レベル経営指標 ==========
/** 現在の現預金残高（万円）。リアルタイム表示用の基準値（実運用ではAPI連携で更新）。 */
export const CASH_BALANCE_MAN = 28000;
/** 店舗1店あたりの月額家賃・共益費の想定（万円）。15店舗分が固定費に加算。 */
export const STORE_RENT_PER_MONTH_MAN = 85;
export const STORE_COUNT = 14;
/** 売上ゼロ時の月間固定費（万円）= 本部人件費 + 店舗家賃（人件費は変動のため最小想定で本部+家賃のみ）。 */
export const MONTHLY_FIXED_COST_NO_SALES_MAN =
  HQ_TOTAL_EXPENSE_MAN + STORE_RENT_PER_MONTH_MAN * STORE_COUNT;
/** Cash Runway（生存可能月数）= 現預金 ÷ 月間固定費。 */
export const CASH_RUNWAY_MONTHS =
  Math.floor(CASH_BALANCE_MAN / MONTHLY_FIXED_COST_NO_SALES_MAN);

// ========== LTV vs CAC（顧客生涯価値 vs 獲得単価） ==========
/** 1人あたりの顧客生涯価値 LTV（円）。客単価×年間購入回数×平均継続年数で算出。 */
export const LTV_JPY = 185000;
/** 1人あたりの顧客獲得コスト CAC（円）。月間広告費÷新規獲得客数で算出。 */
export const CAC_JPY = 5200;
/** LTV/CAC の健全基準（3以上で投資効率良好）。 */
export const LTV_CAC_HEALTHY_THRESHOLD = 3;
export const LTV_CAC_RATIO = LTV_JPY / CAC_JPY;
