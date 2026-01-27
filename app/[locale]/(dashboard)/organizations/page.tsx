/**
 * 組織設定ページ
 * TODO: 実際の組織管理機能を実装
 */
export default function OrganizationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">組織設定</h1>

      <div className="space-y-6">
        {/* 組織情報 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">組織情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="株式会社サンプル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">組織スラッグ</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="sample-company"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL に使用されます: diagnoleads.com/org/sample-company
              </p>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              保存
            </button>
          </div>
        </div>

        {/* メンバー管理 */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">メンバー</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              メンバーを招待
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    参加日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    メンバーがいません
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 危険な操作 */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">組織を削除</h2>
          <p className="text-sm text-gray-600 mb-4">
            組織を削除すると、すべてのデータとメンバーが削除されます。この操作は取り消せません。
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">
            組織を削除
          </button>
        </div>
      </div>
    </div>
  );
}
