/**
 * リード管理ページ
 * TODO: TanStack Table によるリード一覧表示を実装
 */
export default function LeadsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">リード管理</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          新規リード追加
        </button>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex gap-4">
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>すべてのステータス</option>
          <option>新規</option>
          <option>コンタクト済み</option>
          <option>商談中</option>
          <option>成約</option>
          <option>失注</option>
        </select>

        <input
          type="text"
          placeholder="検索..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
        />
      </div>

      {/* リード一覧テーブル */}
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
                会社
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                スコア
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                リードがまだありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TODO: TanStack Table、ページネーション、ソート、フィルタリングを実装 */}
    </div>
  );
}
