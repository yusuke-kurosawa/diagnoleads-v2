/**
 * ダッシュボードメインページ
 * TODO: 実際の統計情報とチャートを実装
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            総リード数
          </h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-xs text-blue-700 mt-2">前月比 +0%</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-2">
            コンバージョン率
          </h3>
          <p className="text-3xl font-bold text-green-600">0%</p>
          <p className="text-xs text-green-700 mt-2">前月比 +0%</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900 mb-2">
            アクティブ診断
          </h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
          <p className="text-xs text-purple-700 mt-2">公開中</p>
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          最近のアクティビティ
        </h2>
        <div className="border border-gray-200 rounded-lg divide-y">
          <div className="p-4 text-sm text-gray-500 text-center">
            アクティビティがまだありません
          </div>
        </div>
      </div>

      {/* TODO: Tremor によるチャート表示 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          リード獲得推移
        </h2>
        <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p>チャートをここに表示</p>
          <p className="text-xs mt-2">Tremor チャートコンポーネントを実装予定</p>
        </div>
      </div>
    </div>
  );
}
