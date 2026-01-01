export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Marathon Planner
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              科學化馬拉松訓練計劃生成器
              <br />
              基於 Jack Daniels VDOT 系統
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              功能
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>個人化訓練計劃</li>
              <li>VDOT 配速計算</li>
              <li>週期化訓練安排</li>
              <li>進度追蹤</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              資源
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>訓練指南</li>
              <li>配速說明</li>
              <li>常見問題</li>
              <li>聯絡我們</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-sm text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} Marathon Planner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
