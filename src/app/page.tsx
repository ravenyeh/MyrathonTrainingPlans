import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 to-lavender-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-rose-300 via-rose-200 to-lavender-200 text-white overflow-hidden">
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-mint-200 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-lemon-200 rounded-full blur-3xl opacity-60" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-sm">
                科學化馬拉松訓練
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-10">
                基於 Jack Daniels VDOT 系統，為你量身打造個人化訓練計劃。
                無論你是初馬挑戰者還是經驗跑者，都能找到最適合的訓練方案。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/plan/new"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-rose-400 rounded-2xl hover:bg-rose-50 transition-all shadow-lg hover:shadow-xl"
                >
                  立即建立計劃
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white text-white rounded-2xl hover:bg-white/20 transition-all"
                >
                  查看儀表板
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">
                無需註冊，立即開始使用
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-4">
                為什麼選擇我們？
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                結合運動科學與個人化數據，打造最適合你的訓練計劃
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  VDOT 配速計算
                </h3>
                <p className="text-gray-500">
                  根據你的近期比賽成績，計算出精確的訓練配速，讓每次訓練都在最佳強度區間。
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-mint-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-mint-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-mint-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  週期化訓練
                </h3>
                <p className="text-gray-500">
                  科學的訓練週期安排：基礎期、強化期、比賽期、減量期，循序漸進達到最佳狀態。
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-lavender-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-lavender-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-lavender-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  個人化調整
                </h3>
                <p className="text-gray-500">
                  根據你的可用時間、跑步經驗和目標賽事，自動調整訓練強度和頻率。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gradient-to-b from-white/50 to-lemon-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-4">
                如何開始？
              </h2>
              <p className="text-lg text-gray-500">
                只需三個簡單步驟，無需註冊
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-300 to-rose-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  輸入你的能力
                </h3>
                <p className="text-gray-500">
                  填寫近期比賽成績或目前跑量，系統會自動計算你的 VDOT 值
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-mint-300 to-mint-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  選擇目標賽事
                </h3>
                <p className="text-gray-500">
                  設定你的目標比賽日期、距離和期望成績
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-lavender-300 to-lavender-400 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  獲得專屬計劃
                </h3>
                <p className="text-gray-500">
                  系統自動生成完整的週期化訓練計劃，開始你的訓練之旅
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-rose-300 via-peach-200 to-lemon-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 drop-shadow-sm">
              準備好挑戰你的下一場馬拉松了嗎？
            </h2>
            <p className="text-xl text-white/90 mb-10">
              現在就開始你的科學化訓練之旅，無需註冊
            </p>
            <Link
              href="/plan/new"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-rose-400 rounded-2xl hover:bg-rose-50 transition-all shadow-lg hover:shadow-xl"
            >
              立即建立訓練計劃
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
